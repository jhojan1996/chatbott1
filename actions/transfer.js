const Accounts = require('../modelAccounts');

exports.transfer = function (res, req){
    console.log('------->transferencias');
    let aFrom;
    let aTo;
    let accountFrom = ((typeof req.body.result.contexts[0].parameters.cuenta_origen.number === 'undefined') ? req.body.result.contexts[0].parameters.cuenta_origen : req.body.result.contexts[0].parameters.cuenta_origen.number.toString());
    let accountTo = ((typeof req.body.result.contexts[0].parameters.cuenta_destino.number === 'undefined') ? req.body.result.contexts[0].parameters.cuenta_destino : req.body.result.contexts[0].parameters.cuenta_destino.number.toString());
    let amount = ((typeof req.body.result.contexts[0].parameters.monto === 'object') ? req.body.result.contexts[0].parameters.monto.number : '');
    let quick_replies = [];

    if (accountFrom === '') {
        Accounts = todo1ChatBot.getAccount("ahorros", true);
        for (key in accounts) {
            quick_replies.push({ content_type: "text", title: accounts[key].type + " " + accounts[key].id, payload: "transferencia" })
        }
        console.log("**** retorno cuenta origen *****");
    } else if (accountTo === '') {
        aFrom = todo1ChatBot.findAccount(cleanedString(accountFrom.toLowerCase()), true);
        if (typeof aFrom === 'undefined') {
            console.log("**** retorno cuenta origen fallo *****");
            error = true;
        } else {
            let accounts = todo1ChatBot.getAccount("ahorros", false);
            for (key in accounts) {
                quick_replies.push({ content_type: "text", title: accounts[key].type + " " + accounts[key].alias, payload: "transferencia" })
            }
            console.log("**** retorno cuenta destino *****");
        }
    } else if (amount === '') {
        aTo = todo1ChatBot.findAccount(cleanedString(accountTo.toLowerCase()), false);
        if (typeof aTo === 'undefined') {
            console.log("**** retorno cuenta destino fallo *****");
            error = true;
        } else {
            console.log("**** retorno monto *****");
            quick_replies = null;
        }
    } else if (confir === '') {
        aFrom = todo1ChatBot.findAccount(cleanedString(accountFrom.toLowerCase()), true);
        aTo = todo1ChatBot.findAccount(cleanedString(accountTo.toLowerCase()), false);
        if (typeof aFrom === 'undefined' || typeof aTo === 'undefined') {
            error = true;
        } else {
            console.log("**** retorno confirmacion *****");
            quick_replies.push({ content_type: "text", title: "Si", payload: "transferencia" });
            quick_replies.push({ content_type: "text", title: "No", payload: "transferencia" });
        }
    } else {
        aFrom = todo1ChatBot.findAccount(cleanedString(accountFrom.toLowerCase()), true);
        aTo = todo1ChatBot.findAccount(cleanedString(accountTo.toLowerCase()), false);
        let text;
        if (typeof aFrom === 'undefined' || typeof aTo === 'undefined') {
            error = true;
        } else {
            console.log("**** retorno final *****");
            if (req.body.result.contexts[0].parameters.valid_confirm === "1") {
                todo1ChatBot.callbackFacebookTransfer(req.body.sessionId, { text: req.body.result.fulfillment.messages[0].speech })

                text = `Cuenta origen: ${accountFrom}\nCuenta destino: ${accountTo}\nValor transferido: $${amount}\nNúmero de Comprobante:  0000042401\nFecha: ${formatDate(new Date())}\nHora: ${formatTime(new Date())}`;
                fs.writeFileSync('resources/' + req.body.sessionId + '.png', text2png(text, {
                    font: '15px Helvetica',
                    textColor: 'black',
                    bgColor: '#F2F2F2',
                    lineSpacing: 10,
                    padding: 10
                }));

                todo1ChatBot.callbackTransfer(text, req.body.sessionId, accountFrom);
            } else {
                quick_replies.push({ content_type: "text", title: "Consultar saldo", payload: "consulta_saldos" });
                quick_replies.push({ content_type: "text", title: "Otra transferencia", payload: "transferencia" });
                quick_replies.push({ content_type: "text", title: "¿Qué puedo hacer?", payload: "ayuda" });
            }
        }
    }
    if (error) {
        quick_replies.push({ content_type: "text", title: "Consultar saldo", payload: "consulta_saldos" });
        quick_replies.push({ content_type: "text", title: "Otra transferencia", payload: "transferencia" });
        request({
            url: 'https://api.api.ai/v1/query?v=' + config.v,
            method: 'POST',
            headers: {
                'Authorization': "Bearer " + config.apiAI_developer_token
            },
            json: true,
            body: {
                query: "cancelar",
                sessionId: sessionId,
                lang: 'es',
                resetContexts: true,
            }
        }, (error, response) => {
            if (error) {
                console.log('Error sending message: ', error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            } else {
                console.log('response-------->', response.body);
            }
        });
        todo1ChatBot.callbackFacebookTransfer(req.body.sessionId, { text: "La información de alguna de las cuentas no coincide." });
        setTimeout(function () {
            return res.json({
                speech: "Que mas deseas hacer?",
                displayText: "Que mas deseas hacer?",
                messages: {
                    text: "Que mas deseas hacer?",
                    quick_replies: quick_replies
                },
                source: 'saludo'
            });
        }, 2000);
    } else if (quick_replies === null) {
        return res.json({
            speech: `texto`,
            displayText: `texto`,
            messages: {
                text: req.body.result.fulfillment.messages[0].speech
            },
            source: 'saludo'
        });
    } else {
        return res.json({
            speech: req.body.result.fulfillment.messages[0].speech,
            displayText: req.body.result.fulfillment.messages[0].speech,
            messages: {
                text: req.body.result.fulfillment.messages[0].speech,
                quick_replies: quick_replies
            },
            source: 'saludo'
        });
    }

}