const Accounts = require('../modelAccounts');

exports.transferencia = function (res, req){
    console.log('***** transferencia *****');
    const cuentaDestino = (typeof req.body.result.contexts[0].parameters.cuenta_destino !== 'undefined') ? req.body.result.contexts[0].parameters.cuenta_destino : '';
    const monto = (typeof req.body.result.contexts[0].parameters.monto.number !== 'undefined') ? req.body.result.contexts[0].parameters.monto.number: '';
    const confirm = (typeof req.body.result.contexts[0].parameters.confirm_transfer !== 'undefined') ? req.body.result.contexts[0].parameters.confirm_transfer : '';
    let response;
    let text;
    let setContext;

    if(cuentaDestino){
        console.log("Cuenta destino enviada =====>", cuentaDestino);
        if(monto){
            console.log("Monton enviado ======>", monto);
            if(confirm){
                console.log("Confirmacion enviada ======>", confirm);
                text = (confirm === 'si' || confirm === 'si') ? `La transferencia fue realizada exitosamente, ¿Puedo ayudarte en algo más?` : `Transferencia no realizada, ¿qué más deseas hacer?`;
                setContext = [{"name":"transferencia", "lifespan":0, "parameters":{}}];
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
                            "confirm": ""
                        }
                    }
                ];
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
                        "confirm": ""
                    }
                }
            ];
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
                    "confirm": ""
                }
            }
        ];
    }

    response = {
        text: text
    };  

    if (setContext) {
        return res.json({
            speech: text,
            displayText: text,
            messages: response,
            contextOut: setContext,
            source: 'pagos'
        });
    }else{
        return res.json({
            speech: text,
            displayText: text,
            messages: response,
            source: 'pagos'
        });
    }
}