'use strict';

var https = require('https');
var inquirer = require('inquirer');

// module exports, implementing the schema
module.exports = {
    onboard: function(username, password, client_id, client_secret) {
        console.log('Onboarding device  .... ');
         return new Promise((resolve, reject) => {
            resolve("access_token_is_here"); 
        });
    }
};
