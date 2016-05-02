var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var github = require('octonode').client(process.env.GITHUB_API_KEY);

var passport = require('passport');
var Strategy = require('passport-github').Strategy;

passport.use(new Strategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK
}, function (accessToken, refreshToken, profile, cb) {
    cb(null, profile);
}));

passport.serializeUser(function (user, cb) {
    cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
    cb(null, obj);
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('express-session')({secret: process.env.SESSION_SECRET, resave: true, saveUninitialized: true}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/', function (req, res, next) {
    if (req.user) {
        github.team(1991469).membership(req.user.username, function (err, isMember) {
            if (err && err.message && err.message != "Not Found") {
                return next(err);
            }
            res.render('index', {user: req.user.username, added: isMember||false});
        });
        return;
    }
    res.render('index');
});

app.get('/login', passport.authenticate('github'));
app.get('/login/callback', passport.authenticate('github', {failureRedirect: '/'}), function (req, res) {
    res.redirect('/')
});

app.get('/logout', function (req, res) {
    req.logOut();
    res.redirect('/');
});

app.post('/invite', require('connect-ensure-login').ensureLoggedIn(), function (req, res) {
    github.team(1991469).membership(req.user.username, function (err, isMember) {
        if(err.messgae="Not Found"||!isMember) {
            github.team(1991469).addMembership(req.user.username, function (err, added) {
                res.json({success: added, message: (err ? err.message : "")});
            });
        } else {
            res.json({success: false, message: 'You have already joined the organization!'})
        }
    });

});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        if (req.accepts('json')) {
            res.json({
                success: false,
                message: err.message,
                error: err
            });
        } else {
            res.render('error', {
                success: false,
                message: err.message,
                error: err
            });
        }
    });
} else {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        if (req.accepts('json')) {
            res.json({
                success: false,
                message: err.message
            });
        } else {
            res.render('error', {
                success: false,
                message: err.message
            });
        }
    });
}

module.exports = app;
