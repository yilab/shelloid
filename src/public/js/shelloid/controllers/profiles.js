/**
 * Created by Harikrishnan on 4/6/14.
 */
var numOfPhoneNumbers = 0;
function initProfilesTab() {
    if (isLoggedIn()) {
        registerForm(profilesForm());
    }
    else {
        window.location = window.actualSite + "/?msgId=1"
    }
}

var profilesForm = function () {
    var form = {};
    form.name = 'profilesForm';
    form.obj = $('#' + form.name);
    form.validator = form.obj.validate({
        rules: {
            profileCurrentPassword: {
                required: true
            },
            profileNewPassword: {
                required: true,
                minlength: 5
            },
            profileConfirmNewPassword: {
                required: true,
                minlength: 5,
                equalTo: "#profileNewPassword"
            },
            myemail: {
                required: true,
                email: true
            },
            myname: {
                required: true
            },
            myphonenumber: {
                required: true,
                minlength: 10
            }
        },
        messages: {
            myphonenumber: {
                required: "Please provide a phone number",
                minlength: "Please enter a 10 digit phone number"
            },
            profileNewPassword: {
                required: "Please provide a password",
                minlength: "Your password must be at least 5 characters long",
                equalTo: "Please enter the same password as above"
            }
        }
    });
    var user = getUser();
    $("#myname").val(user.name);
    $("#myemail").val(user.email);
    $("#myphonenumber").val(user.phoneNumber);
    var changePwdForm = $("#profileChangePwdForm");
    changePwdForm.hide();
    form.changePwdBtn = function (e) {
        e.preventDefault();
        if (changePwdForm.is(":visible")) {
            changePwdForm.hide("fast");
            $("#changeProfilePassword").val(false);
            $("#changePwdBtn").text("Change Password");
        }
        else {
            changePwdForm.show("fast");
            $("#changeProfilePassword").val(true);
            $("#changePwdBtn").text("Don't Change Password");
        }
    };
    form.saveProfilesBtn = function (e) {
        e.preventDefault();
        form.obj.validate();
        if (form.obj.valid()) {
            addWaitingOverlay();
            doPost("/getSalt", {email: getUser().email}, function (resp) {
                    if (resp.status != 200) {
                        bootbox.alert("Invalid username or password. Please try again.");
                        console.log(resp);
                        removeWaitingOverlay();
                    }
                    else {
                        var random = getNewSalt();
                        var data = {
                            changeProfilePassword: undefined,
                            myemail: undefined,
                            myname: undefined,
                            myphonenumber: undefined,
                            profileCurrentPassword: undefined,
                            profileNewPassword: undefined,
                            profileConfirmNewPassword: undefined
                        };
                        fillModel(form.obj, data);
                        data.salt = random;
                        data.md5_secret = MD5(data.salt + ":" + data.profileNewPassword);
                        data.prev_md5_secret = MD5(resp.salt + ":" + data.profileCurrentPassword);
                        delete data.profileNewPassword;
                        delete data.profileConfirmNewPassword;
                        delete data.profileCurrentPassword;
                        doPost("/updateUserData", data, function (resp) {
                            removeWaitingOverlay();
                            if (resp.status == 200) {
                                var user = getUser();
                                user.name = data.myname;
                                user.email = data.myemail;
                                user.phoneNumber = data.myphonenumber;
                                setUser(user);
                                bootbox.alert("<b>Profile Update Successful.</b>");
                            }
                            else {
                                bootbox.alert("<b>An error has occurred while updating the profile.</b><br/>" + (typeof resp.msg == "string"? resp.msg : ""));
                            }
                        }, function (err) {
                            removeWaitingOverlay();
                            console.log(err);
                            bootbox.alert("Server Error: " + err.error);
                        });
                    }
                }, function (err) {
                    removeWaitingOverlay();
                    bootbox.alert("Server Error: " + err.error);
                }
            );
        }
        else {
            bootbox.alert('Please fix input errors and try again.');
        }
    };
    return form;
};