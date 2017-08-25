const request = require('request');
const config = require('../config.js');
const session = require('./session.js');

exports.consultBalance = function (res){
  return new Promise((resolve, reject)=>{

    console.log('Consult Balance ');
    let options = {
      method: 'post',
      url: config.serverApiStore + '/trx/account/balances',
      headers: config.headers,
      json: true
    };
    request(options, (err, response, body) => {
      console.log("*** Detalle de cuentas ***");
      if (!err && body.header.errorCode == '0000' && body.data) {
        resolve("menssageeeeeee");
      }else{
        reject(Error('Error en el servicio'));
      }
    })

  });
  
    
}
