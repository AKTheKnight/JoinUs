$(function () {
    $('#joinbtn').click(function (e) {
        e.preventDefault();
        $('#joinbtn').attr("disabled", true);
        jQuery.post("/invite", {}, function (data) {
            if (!data || !data.success) {
                swal("Error Inviting!", data.message, "error");
                return;
            }
            swal({
                title: "Invited!",
                text: "Please check GitHub for the invitation!",
                type: "success",
                timer: 5000
            }, function () {
                location.reload();
            });
        }, "json").fail(function (err) {
            swal("Error Inviting!", err.statusText, "error");
        }).always(function () {
            $('#joinbtn').attr("disabled", false);
        });
    })
});