const voiceIt = require('VoiceIt');
const Accounts = require('../modelAccounts');

voiceIt.initialize('5cd68e4c391e4c09a5fad1917b4073a5');

exports.transferencia = function (res, req){
    console.log('***** transferencia *****');
    const cuentaDestino = (typeof req.body.result.contexts[0].parameters.cuenta_destino !== 'undefined') ? req.body.result.contexts[0].parameters.cuenta_destino : '';
    const monto = (typeof req.body.result.contexts[0].parameters.monto.number !== 'undefined') ? req.body.result.contexts[0].parameters.monto.number: '';
    const confirm = (typeof req.body.result.contexts[0].parameters.confirm_transfer !== 'undefined') ? req.body.result.contexts[0].parameters.confirm_transfer : '';
    const auth = (typeof req.body.result.contexts[0].parameters.valid_auth !== 'undefined') ? req.body.result.contexts[0].parameters.valid_auth : '';
    let response;
    let text;
    let setContext;

    if(cuentaDestino){
        console.log("Cuenta destino enviada =====>", cuentaDestino);
        if(monto){
            console.log("Monton enviado ======>", monto);
            if(confirm){
                if(confirm === 'si' || confirm === 'si'){
                    if(auth){
                        text = `Tu voz fue reconocida. La transferencia fue realizada con éxito. ¿Puedo ayudarlo en algo más?`;
                        setContext = [{"name":"transferencia", "lifespan":0, "parameters":{}}];
                        response = {
                            text: text
                        };
                        return res.json({
                            speech: text,
                            displayText: text,
                            messages: response,
                            contextOut: setContext,
                            source: 'transferencia'
                        });
                    }else{
                        getEnrollments(data=>{
                            let ingreso = JSON.parse(data);
                            if(ingreso.ResponseCode === "SUC"){
                                let l = ingreso.Result.length;
                                if(l < 3){
                                    text = `Usted tiene ${l} inscripciones. Debe realizar ${3-l} para poder realizar la autenticación`;
                                }else{
                                    text = `Por seguridad necesito confirmar tu identidad. Por favor presiona el botón grabar para iniciar el reconocimiento`;
                                }
                                return res.json({
                                    speech: text,
                                    displayText: text,
                                    messages: response,
                                    contextOut: [
                                        {
                                            "name":"transferencia", 
                                            "lifespan":1, 
                                            "parameters":{
                                                "transferir_action":"transferir", 
                                                "cuenta_destino": cuentaDestino, 
                                                "monto": {"number":monto}, 
                                                "confirm": "",
                                                "valid_auth": ""
                                            }
                                        }
                                    ],
                                    source: 'transferencia'
                                });
                            }
                        });                                             
                    }   
                }else{
                    text = `Pago no realizado, ¿qué más deseas hacer?`;
                    setContext = [{"name":"pago_tarjeta", "lifespan":0, "parameters":{}}];
                    response = {
                        text: text
                    };
                    return res.json({
                        speech: text,
                        displayText: text,
                        messages: response,
                        contextOut: setContext,
                        source: 'transferencia'
                    });
                }
            }else{
                console.log("Confirmacion no enviada");
                text = `Ok. ¿Deseas realizar una transferencia a la cuenta ${cuentaDestino} por valor de ${monto}?`;
                setContext = [
                    {
                        "name":"transferencia", 
                        "lifespan":1, 
                        "parameters":{
                            "transferir_action":"transferir", 
                            "cuenta_destino": cuentaDestino, 
                            "monto": {"number":monto}, 
                            "confirm": "",
                            "valid_auth": ""
                        }
                    }
                ];
                response = {
                    text: text
                };  
                return res.json({
                    speech: text,
                    displayText: text,
                    messages: response,
                    contextOut: setContext,
                    source: 'transferencia'
                });
            }
        }else{
            console.log("Monto no enviado");
            text = `¿Cuanto dinero deseas transferir a la cuenta ${cuentaDestino}?`;
            setContext = [
                {
                    "name":"transferencia", 
                    "lifespan":1, 
                    "parameters":{
                        "transferir_action":"transferir", 
                        "cuenta_destino": cuentaDestino, 
                        "monto": "", 
                        "confirm": "",
                        "valid_auth": ""
                    }
                }
            ];
            response = {
                text: text
            };  
            return res.json({
                speech: text,
                displayText: text,
                messages: response,
                contextOut: setContext,
                source: 'transferencia'
            });
        }
    }else{
        console.log("Cuenta destino no enviada");
        text = `¿A qué cuenta deseas realizar la transferencia?`;
        setContext = [
            {
                "name":"transferencia", 
                "lifespan":1, 
                "parameters":{
                    "transferir_action":"transferir", 
                    "cuenta_destino": "", 
                    "monto": "", 
                    "confirm": "",
                    "valid_auth": ""
                }
            }
        ];
        response = {
            text: text
        };  
        return res.json({
            speech: text,
            displayText: text,
            messages: response,
            contextOut: setContext,
            source: 'transferencia'
        });
    }
}

function getEnrollments(callback){
  voiceIt.getEnrollments({
      userId: "developerUserId",
      password: "d0CHipUXOk",
      callback: function(response){
          callback(response);
      }
  });
}