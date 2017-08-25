const request = require('request');
const config = require('../config.js');
var user;

function startSession(){
  return new Promise((resolve, reject) => {
    let options = {
      method: 'post',
      url: config.serverApiStore + '/security/session/trx',
      headers: config.headers,
      body: {
        "userName": "eprincipal",
        "serviceClassId": "100",
        "encryptedAssertion": ""
      },
      json: true
    };
    request(options, (err, response, body) => {
      console.log("*** inicio de session ***");
      console.log(body.header);
      if (!err && body.header.errorCode == '0000') {
        resolve(body.header);
      }else{
        reject(err);
      }
    })

  });
}

module.exports = {
  startSession: startSession
}