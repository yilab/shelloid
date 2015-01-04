/**
 * Created by Harikrishnan on 02-08-2014.
 */

function initInviteTab() {
    if (isLoggedIn()) {
        $("#inviteSubmit").click(function (e){
            e.preventDefault();
            doPost("/sendInvite", {email: $("#inviteEmail").val()}, function (res) {
                if (res.status == 200) {
                    showToast("Email sent to the user");
                    $("#inviteNotification").text("Email sent to " + $("#inviteEmail").val());
                } else {
                    var msg = (typeof res.msg == "string" ? res.msg : "Server error. Please try again.");
                    console.log(res);
                    showToast(msg);
                    $("#inviteNotification").text(msg);
                }
            });

        });
        $("#inviteEmail").keyup(function (){
            $("#inviteNotification").text("");
        });
    }
    else {
        window.location = window.actualSite + "/?msgId=1"
    }
}