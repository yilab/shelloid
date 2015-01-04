/*
 Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Lesser General Public License 3.0 (https://www.gnu.org/licenses/lgpl.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */
 
window.views = {
    port_mappings: {type: "html", contentId: "portMappings_tab", initfn: initPortMappingsTab},
    devices: {type: "html", contentId: "devices_tab", initfn: initNodesTab},
    device_shares: {type: "html", contentId: "deviceShares_tab", initfn: initNodeSharesTab},
    profiles: {type: "html", contentId: "profiles_tab", initfn: initProfilesTab},
    invite: {type: "html", contentId: "invites_tab", initfn: initInviteTab},
	_default: "port_mappings"
};