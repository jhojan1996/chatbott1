const Accounts = require('../modelAccounts');
exports.transfer = function (res, req){
    console.log('***** transferencia *****');
    const cuentaDestino = (typeof req.body.result.contexts[0].parameters.destination_account !== 'undefined') ? req.body.result.contexts[0].parameters.destination_account : '';
    const monto = (typeof req.body.result.contexts[0].parameters.amount.number !== 'undefined') ? req.body.result.contexts[0].parameters.amount.number: '';
    const confirm = (typeof req.body.result.contexts[0].parameters.confirm !== 'undefined') ? req.body.result.contexts[0].parameters.confirm : '';
    let response;
    let text;
    let setContext;

    if(cuentaDestino){
        console.log("Cuenta destino enviada =====>", cuentaDestino);
        if(monto){
            console.log("Monton enviado ======>", monto);
            if(confirm){
                if(confirm === 'yes'){
                    text = `Ok. The  transfer has been done successfully. Please, tell me what else can I do for you?`;
                    setContext = [{"name":"transfer", "lifespan":0, "parameters":{}}];
                    response = {
                        text: text
                    };
                    return res.json({
                        speech: text,
                        displayText: text,
                        messages: response,
                        contextOut: setContext,
                        source: 'transfer'
                    });
                }else{
                    text = `The transfer has been canceled. Please, tell me what else can I do for you?`;
                    setContext = [{"name":"transfer", "lifespan":0, "parameters":{}}];
                    response = {
                        text: text
                    };
                    return res.json({
                        speech: text,
                        displayText: text,
                        messages: response,
                        contextOut: setContext,
                        source: 'transfer'
                    });
                }
            }else{
                console.log("Confirmacion no enviada");
                text = `Ok. ¿Do you want to make a transfer to ${cuentaDestino}'s account for $${monto}?`;
                setContext = [
                    {
                        "name":"transfer", 
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
                    source: 'transfer'
                });
            }
        }else{
            console.log("Monto no enviado");
            text = `How much do you want to transfer to ${cuentaDestino}'s account?`;
            setContext = [
                {
                    "name":"transfer", 
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
                source: 'transfer'
            });
        }
    }else{
        console.log("Cuenta destino no enviada");
        text = `What is the destination account?`;
        setContext = [
            {
                "name":"transfer", 
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
            source: 'transfer'
        });
    }
}