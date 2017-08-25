const request = require('request');
const config = require('../config.js');
const session = require('./session.js');


const accountsMap = new Map();


exports.originAccounts= function (){
  return new Promise((resolve, reject) => {
    console.log('List origin accounts ');
    let options = {
      method: 'get',
      url: config.serverApiStore + '/trx/transaction/account/origin/TRXLOC_PAYSMPMUL',
      headers: config.headers,
      json: true
    };
    request(options, (err, response, body) => {
      console.log("*** Lista de cuentas ***");
      if (!err && body.header.errorCode == '0000' && body.data) {
        let listaccount =[];
        for(var i =0; i<body.data.length; i++){
          accountsMap.set("acc"+i, [body.data[i].id, body.data[i].alias, body.data[i].maskNumber, body.data[i].bank.bankCode]);
          listaccount.push({content_type:"text", title:`${body.data[i].maskNumber}`, payload:"cuenta_origen"});
        }
        console.log(listaccount.slice(0, 10));
        resolve(listaccount.slice(0, 10));
      }else{
        reject(err);
      }

    });
  });
}

exports.destinationAccounts= function (){
  return new Promise((resolve, reject) => {
    console.log('List destination account');
    console.log('cuenta origen'+ accountsMap.get("acc0"));
    let options = {
      method: 'get',
      url: config.serverApiStore + '/trx/transaction/account/destination?contractId=0&accountId='+accountsMap.get("acc0")[0]+'&bankCode='+accountsMap.get("acc0")[3]+'&transferType=TRXLOC_TRFSMPMUL',
      headers: config.headers,
      json: true
    };
    request(options, (err, response, body) => {
      console.log("*** Lista de cuentas ***");
      if (!err && body.header.errorCode == '0000' && body.data) {
        let listaccount =[];
        for(var i =0; i<body.data.length; i++){
          console.log(body.data[i].maskNumber);
        }
        resolve(body.data);

      }else{
        reject(err);
      }

    });
  })
}