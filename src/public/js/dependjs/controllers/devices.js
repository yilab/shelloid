/**
 * Created by Harikrishnan on 4/6/14.
 */
var deviceDataSet = [];

function initNodesTab() {
    if (isLoggedIn()) {
        registerForm(addNodeForm());
        setupAddNodeHandlers();
        refreshNodesList();
        pollForNewDeviceShares();
        $("#addNodePanelBtn").tooltip({
            'delay': {hide: 5000 }
        });
    }
    else {
        window.location = window.actualSite + "/?msgId=1";
    }
}

function pollForNewDeviceShares() {
    poll.addLongPollHandler("newShareStatus:" + getUser().id, -1, function (ch, res) {
        var userId = (res.from == "db" ? res.refId : getUser().id);
        var nodeId = (res.from == "db" ? res.params : res.nodeId);
        if (!isThereInDataSet(deviceDataSet, "node" + nodeId)) {
            doPost("/getDeviceInfo", {nodeId: nodeId}, function (resp) {
                if (resp.status == 200) {
                    if (!isThereInDataSet(deviceDataSet, "node" + nodeId)) {
                        deviceDataSet.push(getNewNodeRow(nodeId, resp.info.name, resp.info.device_key, resp.info.secret, resp.info.type, resp.info.disabled, resp.info.owner_id, resp.info.status));
                        showDeviceDataTable();
                        updateNodeList();
                    }
                    else{
                        //console.log("skipping...");
                    }
                } else {
                    console.log(resp);
                }
            });
        }
        else{
            //console.log("skipping...");
        }
    });
}

function pollForNodeStatus(id) {
    poll.addLongPollHandler("nodeStatus:" + id, -1, function (ch, res) {
        var nodeId = (res.from == "db" ? res.refId : res.nodeId);
        var status = (res.from == "db" ? res.status : res.msg);
        if (status == "U") {
            //console.log("Device unshare status arrived for " + nodeId + ", so refreshing table");
            doPost("/getDeviceInfo", {nodeId: nodeId}, function (resp) {
                if (resp.status == 200) {
                    if (resp.info.owner_id != getUser().id){
                        removeDeviceFromTableAndRefresh(nodeId);
                    }
                } else {
                    removeDeviceFromTableAndRefresh(nodeId);
                }
                updateNodeList();
            });
        }
        else {
            $("#nodeStatusPicture" + nodeId).attr("src", "images/" + ((status == "C") ? "online" : "offline") + ".png");
        }
    }, function (err) {
        console.log("Error: ", err);
    });
}

var addNodeForm = function () {
    var form = {};
    form.name = 'frmNode';
    form.obj = $('#' + form.name);
    form.validator = form.obj.validate();
    form.addNodeBtn = function (e) {
        e.preventDefault();
        form.obj.validate();
        if (form.validator.form()) {
            var data = {
                sNodeName: undefined,
                sNodeKey: undefined,
                sNodeSecret: undefined,
                sNodeType: undefined,
                addingNewNode: undefined,
                editingNodeId: undefined
            };
            fillModel(form.obj, data);
            addWaitingOverlay();
            doPost("/addDevice", data, function (resp) {
                removeWaitingOverlay();
                if (resp.status == 200) {
                    if (data.addingNewNode == "true") {
                        deviceDataSet.push(getNewNodeRow(resp.insertId, data.sNodeName, data.sNodeKey, data.sNodeSecret, data.sNodeType, 0, getUser().id, 'D'));
                    }
                    else {
                        updateDataSet(deviceDataSet, "node" + data.editingNodeId, "1", data.sNodeName);
                        updateDataSet(deviceDataSet, "node" + data.editingNodeId, "2", data.sNodeKey);
                        updateDataSet(deviceDataSet, "node" + data.editingNodeId, "3", data.sNodeSecret);
                        updateDataSet(deviceDataSet, "node" + data.editingNodeId, "5", getType(data.sNodeType));
                    }
                    showDeviceDataTable();
                    updateNodeList();
                }
                else {
                    console.log(resp);
                    bootbox.alert("<b>An error has occurred while adding the device.</b><br/>" + (typeof resp.msg == "string" ? resp.msg : ""));
                }
            }, function (err) {
                removeWaitingOverlay();
                console.log(err);
                bootbox.alert("Server Error: " + err.error);
            });
            $("#addingNewNode").val("true");
            $("#editingNodeId").val("");
            $("#sNodeName").val("");
            $("#sNodeKey").val("");
            $("#sNodeSecret").val("");
            $("#addNodeCancelBtn").click();
        }
        else {
            bootbox.alert('Please fix input errors and try again.');
        }
    };
    return form;
};

function setupAddNodeHandlers() {
    $("#addNodePanel").hide();
    $("#addNodePanelBtn").click(function (e) {
        e.preventDefault();
        getNewDeviceSecret();
        getNewDeviceKey();
        $("#addNodePanel").show("fast");
        $("#addNodePanelBtn").hide();
    });
    $("#addNodeCancelBtn").click(function (e) {
        e.preventDefault();
        $("#addNodePanel").hide("fast");
        $("#addingNewNode").val("true");
        $("#editingNodeId").val("");
        $("#sNodeName").val("");
        $("#sNodeKey").val("");
        $("#sNodeSecret").val("");
        $("#addNodePanelBtn").show();
    });
    $("#refreshDeviceSecretBtn").click(function (e) {
        getNewDeviceSecret();
    });
}

function getNewDeviceSecret() {
    addWaitingOverlay();
    doPost("/getNewDeviceSecret", {outerHeight: window.outerHeight}, function (resp) {
        removeWaitingOverlay();
        $("#sNodeSecret").val(resp.secret);
    }, function (){
        removeWaitingOverlay();
    });
}

function getNewDeviceKey() {
    addWaitingOverlay();
    doPost("/getNewDeviceKey", {}, function (resp) {
        removeWaitingOverlay();
        $("#sNodeKey").val(resp.key);
    }, function (){
        removeWaitingOverlay();
    });
}

function refreshNodesList() {
    doPost("/listDevices", {disabled: true, showShares: true}, function (resp) {
        if (resp.status == 200) {
            deviceDataSet = [];
            for (var i = 0; i < resp.list.length; i++) {
                deviceDataSet.push(getNewNodeRow(resp.list[i].id, resp.list[i].name, resp.list[i].device_key, resp.list[i].secret, resp.list[i].type, resp.list[i].disabled, resp.list[i].owner_id, resp.list[i].status));
            }
            showDeviceDataTable();
            $("[data-toggle='tooltip']").tooltip();
        }
        else {
            bootbox.alert("<b>An error has occurred while listing the devices.</b><br/>" + (typeof resp.msg == "string" ? resp.msg : ""));
        }
    });
}

function showDeviceDataTable() {
    $('#nodesListTbl').dataTable().fnDestroy();
    $('#nodesListTbl').dataTable({
        destroy: true,
        data: deviceDataSet,
        paging: false,
        searching: true,
        autoWidth: false,
        "columns": [
            { "data": "1" },
            { "data": "2" },
            { "data": "3" },
            { "data": "4" },
            { "data": "5" },
            { "data": "6" },
            { "data": "7" }
        ],
        fnCreatedRow: function (nRow, aData, iDataIndex) {
            if (aData[8] == 1) {
                $(nRow).addClass("disabled_row");
            }
            doPost("/getUserInfoById", {id: aData[4]}, function (resp) {
                $(nRow).children().eq(3).text(resp.user.name);
            });
        }
    });
}

function getNewNodeRow(id, name, node_key, secret, type, disabled, owner, status) {
    var userId = getUser().id;
    var actionTd = '<span class="glyphicon glyphicon-remove" onclick="deleteNode(' + id + ', ' + (owner == userId) + ')" data-toggle="tooltip" data-placement="top" title="Remove This ' + ((owner == userId) ? "Device" : "Share") + '"></span>';
    if (owner == userId) {
        actionTd += '<span class="glyphicon glyphicon-edit" onclick="editNode(' + id + ')"  data-toggle="tooltip" data-placement="top" title="Edit this device"></span>';
    }
    var tr = {
        DT_RowId: "node" + id,
        "1": name,
        "2": (node_key == undefined ? "---" : node_key),
        "3": (secret == undefined ? "---" : secret),
        "4": owner,
        "5": getType(type),
        "6": "<img src='images/" + (status == 'D' ? "offline" : "online") + ".png' id='nodeStatusPicture" + id + "'/>",
        "7": actionTd,
        "8": disabled
    };
    pollForNodeStatus(id);
    return tr;
}

function getType(type) {
    var typeStr;
    switch (type) {
        case "L":
        {
            typeStr = "Laptop";
            break;
        }
        case "S":
        {
            typeStr = "Server";
            break;
        }
        case "E":
        {
            typeStr = "Embedded";
            break;
        }
        default:
        {
            typeStr = "Workstation";
            break;
        }
    }
    return typeStr;
}

function editNode(id) {
    var node = $("#node" + id).children();
    $("#addNodePanel").show("fast");
    $("#addNodePanelBtn").hide();
    $("#editingNodeId").val(id);
    $("#sNodeName").val(node.eq(0).text());
    $("#sNodeSecret").val(node.eq(2).text());
    $("#sNodeType").find(":selected").text(node.eq(4).text());
    $("#sNodeKey").val(node.eq(1).text());
    $("#addingNewNode").val(false);
}

function deleteNode(id, ownNode) {
    if (ownNode) {
        bootbox.dialog({
            message: 'If you want to delete the device, please type the word "delete" without double quotes in the below text box and click Delete <br/><br/><input type="text" class="form-control" id="removeDeviceConfirmTextBox"/>',
            title: "Deleting your own device (" + getFromDataSet(deviceDataSet, "node" + id, "1" )+")",
            buttons: {
                success: {
                    label: "Cancel",
                    className: "btn-success",
                },
                danger: {
                    label: "Delete",
                    className: "btn-danger",
                    callback: function() {
                        if($("#removeDeviceConfirmTextBox").val() == "delete"){
                            var data = {nodeId: id};
                            doPost("/deleteDevice", data, function (resp) {
                                if (resp.status == 200) {
                                    removeDeviceFromTableAndRefresh(id);
                                }
                                else if (resp.status == 201) {
                                    bootbox.alert("Warning: " + resp.msg);
                                }
                                else {
                                    bootbox.alert("Error: " + (typeof resp.msg == "string" ? resp.msg : "Can't delete device"));
                                }
                            }, function (err) {
                                bootbox.alert("Error: " + err);
                            });
                        } else {
                            bootbox.alert("You typed the wrong word.");
                        }
                    }
                }
            }
        });
    }
    else {
        deleteNodeShare("#node", getUser().id, id, false, function (){
            removeDeviceFromTableAndRefresh(id);
        });
    }
}

function removeDeviceFromTableAndRefresh(id) {
    removeFromDataset(deviceDataSet, "node" + id);
    removeDeviceStatusPoll(id);
    updateNodeList();
    showDeviceDataTable();
}

function updateNodeList() {
    updateNodeListInNodeShares();
    updateNodeListInPortMappings();
}

function removeDeviceStatusPoll(id) {
    poll.removeLongPollHandler("nodeStatus:" + id);
}
