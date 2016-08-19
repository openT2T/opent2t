"use strict";
var https = require('https');
var deviceInfo = require('opent2t-onboarding-hub').deviceInfo;

/**
* This translator class implements the "Hub" interface.
*/
class winkHubTranslator {
    constructor(accessToken) {
        this._accessToken = accessToken;

        this._baseUrl = "api.one.com";
        this._devicesPath = '/users/me/one_devices';
    }

    /**
     * Get the list of devices discovered through the hub.
     */
    getDevicesAsync(idKeyFilter) {
         return new Promise((resolve, reject) => {
            resolve(
                [{
                    id: 1234,
                    name: "OneLightBulb",
                    manufacturer: "OneCorp"
                }]
            ); 
        });
    }
}
module.exports = winkHubTranslator;
