/**
 * Created by Harikrishnan on 7/6/14.
 */
var deviceShareDataset = [];

function initNodeSharesTab() {
    if (isLoggedIn()) {
        registerForm(addNodeSharesForm());
        setupNodeSharesHandlers();
        updateNodeListInNodeShares();
        $("#shareThisNodeBtn").tooltip();
    }
    else {
        window.location = window.actualSite + "/?msgId=1"
    }
}

var addNodeSharesForm = function () {
    var form = {};
    form.name = 'nodeSharesForm';
    form.obj = $('#' + form.name);
    form.validator = form.obj.validate();
    form.shareThisNodeBtn = function (e) {
        e.preventDefault();
        if ($("#nodeSharesNodeList :selected").size() > 0) {
            if ($(".tempNodeShare").size() == 0) {
                var tbl = $("#nodeSharesTbl");
                var tr = $("<tr class='tempNodeShare'></tr>");
                tr.append("<td colspan='2'><input type='email' id='tempNodeShareEmail' class='form-control' placeholder='Enter email ID for the user to whom you want to share this device'/></td>");
                tr.append('<td><span class="glyphicon glyphicon-floppy-disk" onclick="saveTempNodeShare()" data-toggle="tooltip" data-placement="top" title="Save Sharing"></span>' +
                    '<span class="glyphicon glyphicon-remove" onclick="deleteTempNodeShare()" data-toggle="tooltip" data-placement="top" title="Remove Sharing"></span></td>');
                tbl.append(tr);
                $("[data-toggle='tooltip']").tooltip();
            }
            else {
                bootbox.alert("Please save the newly added share.");
            }
        } else {
            bootbox.alert("Please select a node to share.");
        }
    };
    return form;
};

function setupNodeSharesHandlers() {
    $("#nodeSharesNodeList").change(function () {
        if ($(".tempNodeShare").size() > 0) {
            bootbox.dialog({
                message: "You have unsaved items in the device shares.<br/>Do you want to discard them?",
                title: "<b>Warning: Unsaved Changes</b>",
                buttons: {
                    danger: {
                        label: "Yes",
                        className: "btn-danger",
                        callback: function () {
                            refreshNodeSharesUserList();
                        }
                    },
                    main: {
                        label: "No",
                        className: "btn-success",
                        callback: function () {
                        }
                    }
                }
            });
        }
        else {
            refreshNodeSharesUserList();
        }
    });
}

function refreshNodeSharesUserList() {
    var data = {
        nodeId: $("#nodeSharesNodeList").val()
    };
    addWaitingOverlay();
    doPost("/getSharedList", data, function (resp) {
        removeWaitingOverlay();
        if (resp.status == 200) {
            $('.nodeShareUserList').remove();
            deleteTempNodeShare();
            deviceShareDataset = [];
            for (var i = 0; i < resp.list.length; i++) {
                deviceShareDataset.push(getNodeSharesTableRow(resp.list[i].name, resp.list[i].email, data.nodeId, resp.list[i].id));
            }
            showDeviceShareTable();
            $("[data-toggle='tooltip']").tooltip();
        }
        else {
            bootbox.alert("<b>An error has occurred while refreshing the device share list.</b><br/>" + (typeof resp.msg == "string"? resp.msg : ""));
        }
    }, function (err) {
        removeWaitingOverlay();
        console.log(err);
        bootbox.alert("Server Error: " + err.error);
    });
}

function showDeviceShareTable(){
    $('#nodeSharesTbl').dataTable().fnDestroy();
    $('#nodeSharesTbl').dataTable({
        destroy: true,
        data: deviceShareDataset,
        paging: false,
        autoWidth: false,
        searching: false,
        "columns": [
            { "data": "1" },
            { "data": "2" },
            { "data": "3" }
        ]
    });

}

function updateNodeListInNodeShares() {
    doPost("/listDevices", {disabled: false, showShares: false}, function (resp) {
        if (resp.status == 200) {
            var sel = $("#nodeSharesNodeList");
            sel.empty();
            for (var i = 0; i < resp.list.length; i++) {
                sel.append($('<option value="' + resp.list[i].id + '">' + resp.list[i].name + '</option>'));
            }
            refreshNodeSharesUserList();
        }
        else {
            bootbox.alert("<b>An error has occurred while listing the devices.</b><br/>" + (typeof resp.msg == "string"? resp.msg : ""));
        }
    });
}

function deleteTempNodeShare() {
    $(".tempNodeShare").remove();
}

function deleteNodeShare(prefix, userId, nodeId, indludeUserId, callback) {
    bootbox.confirm("Are you sure to delete this sharing?", function (result) {
        if (result == true) {
            var data = {
                userId: userId,
                nodeId: nodeId
            };
            addWaitingOverlay();
            doPost("/deleteDeviceShare", data, function (resp) {
                removeWaitingOverlay();
                if (resp.status == 200) {
                    if (indludeUserId) {
                        removeFromDataset(deviceShareDataset, "nodeShare" + userId + "_" + nodeId);
                        showDeviceShareTable();
                    }
                    else {
                        callback();
                    }
                }
                else {
                    console.log(resp);
                    bootbox.alert("<b>An error has occurred while deleting the device share.</b><br/>" + (typeof resp.msg == "string"? resp.msg : ""));
                }
            }, function (){
                removeWaitingOverlay();
            });
        }
    });
}

function saveTempNodeShare() {
    var data = {
        email: $("#tempNodeShareEmail").val(),
        nodeId: $("#nodeSharesNodeList").val()
    };
    addWaitingOverlay();
    doPost("/addDeviceShare", data, function (resp) {
        removeWaitingOverlay();
        if (resp.status == 200) {
            deleteTempNodeShare();
            deviceShareDataset.push(getNodeSharesTableRow(resp.name, data.email, data.nodeId, resp.id));
            showDeviceShareTable();
        }
        else {
            console.log(resp);
            var msg = "<b>An error has occurred while sharing the device.</b><br/>";
            if (typeof resp.msg == "string") {
                msg += resp.msg;
            }
            else {
                msg += "Probably the device is already assigned to the user.";
            }
            bootbox.alert(msg);
        }
    }, function (){
        removeWaitingOverlay();
    });
}

function getNodeSharesTableRow(name, email, nodeId, userId) {
    var tr = {
        DT_RowId: "nodeShare" + userId + "_" + nodeId,
        "1": name,
        "2": email,
        "3": '<span class="glyphicon glyphicon-remove" onclick="deleteNodeShare(\'#nodeShare\', ' + userId + ", " + nodeId + ', true)" data-toggle="tooltip" data-placement="top" title="Remove Sharing"></span>'
    }
    return tr;
}