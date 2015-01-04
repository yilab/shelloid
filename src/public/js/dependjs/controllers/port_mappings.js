/**
 * Created by Harikrishnan on 16-07-2014.
 */
var numOfPortMappings;
var PORT_MAP_DELETED = "0";
var PORT_MAP_APP_SIDE_CLOSED = "1";
var PORT_MAP_SVC_SIDE_OPEN = "2";
var PORT_MAP_APP_SIDE_OPEN = "3";
var portSvcMap = {};
var portMapDataset = [];

function initPortMappingsTab() {
    if (isLoggedIn()) {
        createSrvIndex();
        registerForm(addPortMappingForm());
        setupAddPortMappingHandlers();
        resetAddPortMappingForm();
        refreshPortMappingsList(true);
        updateNodeListInPortMappings();
        preparePortCombo();
        pollForNewPortMaps();
        bindToolTip();
        setupTour();
    }
    else {
        window.location = window.actualSite + "/?msgId=1"
    }
}

function bindToolTip(){
    $(".mappedPortColTitle").tooltip();
    $("[data-toggle='tooltip']").tooltip();
}

function pollForNewPortMaps(){
    poll.addLongPollHandler("newPortMap:" + getUser().id, -1, function (ch, res) {
        var portMapId = (res.from == "db") ? res.params : res.portMapId;
        if (!isThereInDataSet(portMapDataset, "portMapping" + portMapId)) {
            doPost("/getPortMapInfo", {portMapId: portMapId}, function (resp) {
                if (resp.status == 200) {
                    if (!isThereInDataSet(portMapDataset, "portMapping" + portMapId)) {
                        numOfPortMappings++;
                        portMapDataset.push(getNewPortMappingRow(true, numOfPortMappings, resp.info.id, resp.info.fromDeviceName, resp.info.fromPort, resp.info.toDeviceName, resp.info.toPort, resp.info.date, resp.info.protocol, resp.info.disabled, resp.info.fromDeviceUserName, resp.info.toDeviceUserName));
                        refreshPortMappingsList(true);
                        bindToolTip();
                    }
                    else{
                        //console.log("skipping...");
                    }
                } else {
                    //console.log(resp);
                }
            });
        }
        else{
            //console.log("skipping...");
        }
    });
}

function createSrvIndex() {
    for (var i = 0; i < srvList.length; i++) {
        portSvcMap[srvList[i].port] = srvList[i].name;
    }
}

function getSvcForPort(port) {
    if (portSvcMap[port] != undefined) {
        return portSvcMap[port] + " (" + port + ")";
    }
    else {
        if (port == "" || port == undefined || port == null) {
            port = "Not ready";
        }
        return port;
    }
}

function preparePortCombo() {
    $("#portMappingNumber").select2({
        minimumInputLength: 1,
        query: function (query) {
            var filterPortFn = function (element) {
                return getAsStr(element.port).indexOf(query.term) > -1;
            };
            var filterSvcFn = function (element) {
                return getAsStr(element.name).indexOf(query.term) > -1;
            };
            var data = {results: []};
            var filteredPorts = srvList.filter(filterPortFn);
            var filteredSvcs = srvList.filter(filterSvcFn);
            data.results.push({id: query.term, text: query.term});
            for (var i = 0; i < filteredPorts.length; i++) {
                data.results.push({id: filteredPorts[i].port, text: filteredPorts[i].name + " (" + filteredPorts[i].port + ")"});
            }
            for (var i = 0; i < filteredSvcs.length; i++) {
                data.results.push({id: filteredSvcs[i].port, text: filteredSvcs[i].name + " (" + filteredSvcs[i].port + ")"});
            }
            query.callback(data);
        }
    });
}

function pollForPortMappings(id) {
    poll.addLongPollHandler("portMapStatus:" + id, -1, function (ch, res) {
        var addedPort = false;
        var status;
        if (res.from == "db") {
            status = res.status;
        } else {
            status = res.action;
        }
        switch (status) {
            case PORT_MAP_DELETED:
            {
                if (res.from == "db") {
                    removePortMappingPoll(res.refId);
                    removeFromDataset(portMapDataset, "portMapping" + res.refId);
                }
                else {
                    removePortMappingPoll(id);
                    removeFromDataset(portMapDataset, "portMapping" + id);
                }
                showPortMapDataTable();
                break;
            }
            case PORT_MAP_SVC_SIDE_OPEN:
            {
                var toPort;
                if (res.from == "db") {
                    toPort = res.params;
                }
                else {
                    toPort = res.mappedPort;
                }
                updateDataSet(portMapDataset, "portMapping" + id, "6", '<span class="mappedPortColTitle" data-toggle="tooltip" data-placement="top" data-html="true" title="The service can be accessed at localhost:'+toPort+' from the guest device.">' + toPort + "</span>");
                showPortMapDataTable();
                break;
            }
            default:
            {
                //console.log("Not processing: ", res + " because action = " + status);
                break;
            }
        }
        bindToolTip();
    }, function (err) {
        console.log("Error: ", err);
    });
}

function removePortMappingPoll(id) {
    poll.removeLongPollHandler("portMapStatus:" + id);
}

function refreshPortMappingsList(addPoll) {
    numOfPortMappings = 0;
    doPost("/listPortMappings", {}, function (resp) {
        if (resp.status == 200) {
            portMapDataset = [];
            for (var i = 0; i < resp.list.length; i++) {
                numOfPortMappings++;
                portMapDataset.push(getNewPortMappingRow(addPoll, i + 1, resp.list[i].id, resp.list[i].fromDeviceName, resp.list[i].fromPort, resp.list[i].toDeviceName, resp.list[i].toPort, new Date(resp.list[i].date), resp.list[i].protocol, resp.list[i].disabled, resp.list[i].fromDeviceUserName, resp.list[i].toDeviceUserName));
            }
            showPortMapDataTable();
            $("[data-toggle='tooltip']").tooltip();
        }
        else {
            bootbox.alert("<b>An error has occurred while listing the port mappings.</b><br/>" + (typeof resp.msg == "string" ? resp.msg : ""));
        }
    });
}

function showPortMapDataTable() {
    $('#portMappingListTbl').dataTable().fnDestroy();
    $('#portMappingListTbl').dataTable({
        destroy: true,
        data: portMapDataset,
        paging: false,
        searching: true,
        autoWidth: false,
        "columns": [
            { "data": "0" },
            { "data": "1" },
            { "data": "2" },
            { "data": "3" },
            { "data": "4" },
            { "data": "5" },
            { "data": "6" },
            { "data": "7" },
            { "data": "8" }
        ],
        fnCreatedRow: function (nRow, aData, iDataIndex) {
            if (aData[9] == 1) {
                $(nRow).addClass("disabled_row");
            }
        }
    });
}

var addPortMappingForm = function () {
    var form = {};
    form.name = 'frmAddPortMap';
    form.obj = $('#' + form.name);
    form.validator = form.obj.validate();
    form.addPortMappingBtn = function (e) {
        e.preventDefault();
        form.obj.validate();
        if (form.validator.form()) {
            var data = {
                portMappingNodesFrom: undefined,
                portMappingNumber: undefined,
                portMappingNodesTo: undefined
            };
            fillModel(form.obj, data);
            if (data.portMappingNodesFrom != data.portMappingNodesTo) {
                var port = parseInt(data.portMappingNumber);
                if (port > 0 && port <= 65535) {
                    data.portMappingProtocolTcp = $("#portMappingProtocolTcp").is(":checked");
                    addWaitingOverlay();
                    doPost("/addPortMapping", data, function (resp) {
                        removeWaitingOverlay();
                        if (resp.status == 500) {
                            console.log(resp);
                            bootbox.alert("<b>An error has occurred while adding the device.</b><br/>" + (typeof resp.msg == "string" ? resp.msg : "Probably a same mapping exists."));
                        }
                        else {
                            portMapDataset.push(getNewPortMappingRow(true, numOfPortMappings++, resp.insertId, $("#portMappingNodesFrom").find(":selected").text(), data.portMappingNumber, $("#portMappingNodesTo").find(":selected").text(), "", new Date(), data.portMappingProtocolTcp == true ? "TCP" : "UDP", 0, resp.svcDevUserName, resp.mappedDevUserName));
                            showPortMapDataTable();
                            $("#addPortMappingCancelBtn").click();
                            if (resp.status != 200) {
                                bootbox.alert("Successfully saved port map. But some warnings occurred: " + (typeof resp.msg == "string"? resp.msg : "") + ". However the mapping will be available when the device connects for the next time.");
                            }
                        }
                        bindToolTip();
                    }, function (err) {
                        removeWaitingOverlay();
                        console.log(err);
                        bootbox.alert("Server Error: " + err.error);
                    });
                }
                else {
                    bootbox.alert('Port number must be a number, greater than zero and less than 65536.');
                }
            }
            else {
                bootbox.alert('You must select two different devices to share ports.');
            }
        }
        else {
            bootbox.alert('Please fix input errors and try again.');
        }
    };
    return form;
};

function setupAddPortMappingHandlers() {
    $("#addPortMappingPanel").hide();
    $("#addPortMappingPanelBtn").click(function (e) {
        e.preventDefault();
        $("#addPortMappingPanel").show("fast");
        $("#addPortMappingPanelBtn").hide();
    });
    $("#addPortMappingCancelBtn").click(function (e) {
        e.preventDefault();
        $("#addPortMappingPanel").hide("fast");
        resetAddPortMappingForm();
        $("#addPortMappingPanelBtn").show();
    });
}

function resetAddPortMappingForm() {
    $("#portMappingNumber").text("");
    $("#portMappingProtocolTcp").click();
}

function updateNodeListInPortMappings() {
    doPost("/listDevices", {disabled: false, showShares: true}, function (resp) {
        if (resp.status == 200) {
            var toDevices = $("#portMappingNodesTo");
            var fromDevices = $("#portMappingNodesFrom");
            toDevices.empty();
            fromDevices.empty();
            for (var i = 0; i < resp.list.length; i++) {
                toDevices.append($('<option value="' + resp.list[i].id + '">' + resp.list[i].name + '</option>'));
                if (resp.list[i].owner_id == getUser().id) {
                    fromDevices.append($('<option value="' + resp.list[i].id + '">' + resp.list[i].name + '</option>'));
                }
            }
        }
        else {
            bootbox.alert("<b>An error has occurred while listing the devices.</b><br/>" + (typeof resp.msg == "string"? resp.msg : ""));
        }
    });
}

function getNewPortMappingRow(addPoll, seqNo, id, portMappingNodesFrom, portMappingNumber, portMappingNodesTo, toPort, date, protocol, disabled, fromUserName, toUserName) {
    var formattedDate = moment(date).format("D MMM YYYY, h:mm a");
    if (toPort == undefined){
        toPort = "";
    }
    var row = {
        DT_RowId: "portMapping" + id,
        "1": fromUserName,
        "0": portMappingNodesFrom,
        "2": getSvcForPort(portMappingNumber),
        "3": protocol,
        "5": toUserName,
        "4": portMappingNodesTo,
        "6": (isEmptyString(toPort) ? "Not ready" : '<span class="mappedPortColTitle" data-toggle="tooltip" data-placement="top" data-html="true" title="The service can be accessed at localhost:'+toPort+' from the guest device.">' + toPort + "</span>"),
        "7": formattedDate,
        "8": '<span class="glyphicon glyphicon-remove" onclick="deletePortMapping(' + id + ')" data-toggle="tooltip" data-placement="top" title="Remove Port map"></span>',
        "9": disabled
    };
    if (addPoll == true) {
        pollForPortMappings(id);
    }
    return row;
}

function deletePortMapping(id) {
    bootbox.confirm("Are you sure to delete this port mapping?", function (result) {
        if (result == true) {
            var data = {id: id};
            doPost("/deletePortMapping", data, function (resp) {
                if (resp.status == 500) {
                    bootbox.alert("Error: " + (typeof resp.msg == "string" ? resp.msg : "Can't delete port mapping"));
                }
                else {
                    $("#portMapping" + id).addClass("disabled_row");
                    if (resp.status != 200) {
                        console.log(resp);
                        bootbox.alert("Operation completed with some warnings: " + (typeof resp.msg == "string"? resp.msg : ""));
                    }
                }
            }, function (err) {
                bootbox.alert("Error: " + err);
            });
        }
    });
}