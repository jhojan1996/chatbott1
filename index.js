const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const uuid = require('uuid');
const apiai = require('apiai');
const fs = require('fs');
const voiceIt = require('VoiceIt');
var BinaryServer = require('binaryjs').BinaryServer;
var wav = require('wav');

const config = require('./config.js');//Module that returns the tokens.
const transfer = require('./actions/transfer.js');
const balance = require('./actions/balance');
const session = require('./actions/session.js');
const accounts = require('./actions/accounts.js');
const movements = require('./actions/movements');
const listAccounts = require('./model.js');


const userMap = new Map();
//var sessionIds = new Map();


class Todo1ChatBot {

    constructor() {
        this.apiaiApp = apiai(config.apiAI_token);
        this.sessionIds = new Map();
    }

    sendMessage(text, id) {

        if (!this.sessionIds.has(id)) {
            this.sessionIds.set(id, uuid.v4());
        }

        let apiai = this.apiaiApp.textRequest(text, {
            sessionId: this.sessionIds.get(id)
        });

        apiai.on('response', (response) => {
            console.log("req_message----->", response.result.fulfillment.messages);
            if (response.result.fulfillment.messages.length) {
                console.log("req_message----->1");
                this.callbackFacebook(id, { text: response.result.fulfillment.messages[0].speech });
            } else {
                console.log("req_message----->2");
                this.callbackFacebook(id, response.result.fulfillment.messages);
            }

        });

        apiai.on('error', (error) => {
            console.log(error);
        });

        apiai.end();

    }

    sendEvent(event, id) {

        if (!this.sessionIds.has(id)) {
            this.sessionIds.set(id, uuid.v4());
        }

        let ev = {
            name: event
        };

        let apiai = this.apiaiApp.eventRequest(ev, {
            sessionId: this.sessionIds.get(id) // use any arbitrary id
        });


        apiai.on('response', (response) => {
            console.log("req_event----->", response.result.fulfillment.messages);
            if (response.result.fulfillment.messages.length) {
                console.log("req_event----->1");
                this.callbackFacebook(id, { text: response.result.fulfillment.messages[0].speech });
            } else {
                console.log("req_event----->2");
                this.callbackFacebook(id, response.result.fulfillment.messages);
            }

        });

        apiai.on('error', (error) => {
            console.log(error);
        });

        apiai.end();

    }

    cancelContext(sessionId){
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
    }

    callbackFacebook(id, menssage) {

        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: { access_token: config.facebook_token },
            method: 'POST',
            json: {
                recipient: { id: id },
                message: menssage
            }
        }, (error, response) => {
            if (error) {
                console.log('Error sending message: ', error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            }
        });

    }

    callbackFacebookTransfer(id, message) {
        let k;

        this.sessionIds.forEach((value, key) => {
            if (value === id) {
                k = key;
            }
        });

        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: { access_token: config.facebook_token },
            method: 'POST',
            json: {
                recipient: { id: k },
                message: message
            }
        }, (error, response) => {
            if (error) {
                console.log('Error sending message: ', error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            }
        });

    }

    callbackTransfer(text, id, accountFrom) {
        let k;

        this.sessionIds.forEach((value, key) => {
            if (value === id) {
                k = key;
            }
        });

        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: { access_token: config.facebook_token },
            method: 'POST',
            json: {
                recipient: { id: k },
                message: {
                    attachment: {
                        type: "image",
                        payload: {
                            url: "https://chatbot-todo1.azurewebsites.net/images/" + id + ".png"
                        }
                    }
                }
            }
        }, (error, response) => {
            if (error) {
                console.log('Error sending message: ', error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            } else {

                request({
                    url: 'https://graph.facebook.com/v2.6/me/messages',
                    qs: { access_token: config.facebook_token },
                    method: 'POST',
                    json: {
                        recipient: { id: k },
                        message: {
                            text: "Deseas realizar alguna otra operación?",
                            quick_replies: [
                                {
                                    content_type: "text",
                                    title: "Saldo de " + accountFrom,
                                    payload: "saldo"
                                },
                                {
                                    content_type: "text",
                                    title: "Otra transferencia",
                                    payload: "transferencia"
                                },
                                {
                                    content_type: "text",
                                    title: "¿Qué más puedo hacer?",
                                    payload: "ayuda"
                                }
                            ]
                        }
                    }
                }, (error, response) => {
                    if (error) {
                        console.log('Error sending message: ', error);
                    } else if (response.body.error) {
                        console.log('Error: ', response.body.error);

                    }
                });

            }
        });

    }

    userInfoRequest(userId) {
        console.log('userInfoRequest-userId', userId);

        return new Promise((resolve, reject) => {

            request({
                method: 'GET',
                uri: "https://graph.facebook.com/v2.6/" + userId + "?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=" + config.facebook_token
            }, function (error, response) {
                if (error) {
                    console.error('Error while userInfoRequest: ', error);
                    reject(error);
                } else {
                    var obj = JSON.parse(response.body);
                    resolve(obj);
                }
            });
        });

    }

    setupGetStartedButton(res) {
        var data = {
            setting_type: "call_to_actions",
            thread_state: "new_thread",
            call_to_actions: [
                {
                    payload: "getStarted"
                }
            ]
        };

        // Start the request
        request({
            url: 'https://graph.facebook.com/v2.6/me/thread_settings',
            qs: { access_token: config.facebook_token },
            method: 'POST',
            json: data
        },
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    // Print out the response body
                    res.send(body);

                } else {
                    // TODO: Handle errors
                    res.send(body);
                }
            });
    }


    setupMenu(res) {
        var data = {
            persistent_menu: [
                {
                    locale: "default",
                    composer_input_disabled: false,
                    "call_to_actions": [
                        {
                            "title": "Ayuda del chat",
                            "type": "postback",
                            "payload": "ayuda"
                        },
                        {
                            "title": "Información de seguridad",
                            "type": "postback",
                            "payload": "informacion"
                        }
                    ]
                }
            ]
        };

        // Start the request
        request({
            url: 'https://graph.facebook.com/v2.6/me/messenger_profile',
            qs: { access_token: config.facebook_token },
            method: 'POST',
            json: data
        },
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    // Print out the response body
                    res.send(body);

                } else {
                    // TODO: Handle errors
                    res.send(body);
                }
            });
    }

    setupAcountLinkingUrl(res) {
        var data = {
            account_linking_url: "https://chatbot-todo1.azurewebsites.net/confirmAuth"
        };

        // Start the request
        request({
            url: 'https://graph.facebook.com/v2.6/me/messenger_profile',
            qs: { access_token: config.facebook_token },
            method: 'POST',
            json: data
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                // Print out the response body
                res.send(body);

            } else {
                // TODO: Handle errors
                res.send(body);
            }
        });
    }

    findAccount(text, criterion) {

        let cuenta = listAccounts.accounts.find((element) => {
            return element.alias === text && element.propia === criterion
        });

        if (typeof cuenta === 'undefined') {
            cuenta = listAccounts.accounts.find((element) => {
                return element.type === text && element.propia === criterion
            });
        }

        if (typeof cuenta === 'undefined') {
            cuenta = listAccounts.accounts.find((element) => {
                return element.id === text && element.propia === criterion
            });
        }

        return cuenta;
    }

    listAccount(criterion) {

        let list = listAccounts.accounts.filter((element) => {
            return element.propia === criterion
        });

        return list;
    }

    getAccount(txt, criterion) {
        let list = listAccounts.accounts.filter((element) => {
            return element.id === txt && element.propia === criterion;
        });

        if (list.length === 0) {
            list = listAccounts.accounts.filter((element) => {
                return element.alias === txt && element.propia === criterion;
            });
        }

        if (list.length === 0) {
            list = listAccounts.accounts.filter((element) => {
                return element.type === txt && element.propia === criterion;
            });
        }

        return list;
    }

    listAccountDetail(id) {
        let listDetail = listAccounts.details.filter((element) => {
            return element.id === id
        });

        return listDetail;
    }

    listUser(user, pass){
        let listUser = listAccounts.users.find((element) => {
            return user === element.username && pass === element.password;
        });

        return listUser;
    }
}

let todo1ChatBot = new Todo1ChatBot();
voiceIt.initialize('5cd68e4c391e4c09a5fad1917b4073a5');
const app = express();

app.use(bodyParser.json({limit: "100mb", type:'application/json'}));
app.use(bodyParser.urlencoded({limit: "100mb", extended: true, parameterLimit:50000}));
app.use(express.static('src'));
app.use(express.static('assets'));

const server = app.listen(process.env.PORT || 5000, () => {
    console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
    console.log("funciona------> get", __dirname);
});

/* For Facebook Validation */
app.get('/webhook', (req, res) => {
    console.log("get----->");
    if (req.query['hub.mode'] && req.query['hub.verify_token'] === 'todo_test') {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.status(403).end();
    }
});


app.get('/setup', function (req, res) {
    todo1ChatBot.setupAcountLinkingUrl(res);
});

app.get('/authorize',function(req,res){
    console.log(req.query);

    if (req.query && req.query.redirect_uri && req.query.username && req.query.password) {
        let username = req.query.username;
        let password = req.query.password;

        let user = todo1ChatBot.listUser(username,password);
        let redirectUri;

        if(user){
            redirectUri = req.query.redirect_uri + '&authorization_code=' + password;
        }else{
            redirectUri = req.query.redirect_uri;
        }
        return res.redirect(redirectUri);
    } else {
        return res.send(400, 'Request did not contain redirect_uri and username in the query string');
    }
});

app.get('/', (req, res) => {
    console.log("get /----->");
    //res.status(200).send("correcto");
    res.sendfile('demo.html');
});

app.post('/submitRecord',(req,res)=>{
    request.post({
        url: 'http://innovati.com.co/backend/apis/upload_wav.php',
        body: "blob="+req.body.data
    }, (error, response) => {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        } else {
            console.log('response-------->', response.body);
            return res.send(response);
        }
    });
});

/*Autenticacion por voz*/
app.post('/getEnrollments',(req,res)=>{
    voiceIt.getEnrollments({
        userId: req.body.userId,
        password: req.body.password,
        callback: function(response){
            res.send(response);
        }
    });
});

app.post('/createEnrollmentByWavURL',(req,res)=>{
    voiceIt.createEnrollmentByWavURL({
        userId: req.body.userId,
        password: req.body.password,
        urlToEnrollmentWav: req.body.wavUrl,
        contentLanguage: 'es-CO',
        callback: function(response){
            res.send(response);
        }
    });
});

app.post('/deleteEnrollment',(req,res)=>{
    voiceIt.deleteEnrollment({
        userId: req.body.userId,
        password: req.body.password,
        enrollmentId: req.body.enrollmentId,
        contentLanguage: 'es-CO',
        callback: function(response){
            res.send(response);
        }
    });
});

app.post('/authentication',(req,res)=>{
    voiceIt.authentication({
        userId: req.body.userId,
        password: req.body.userId,
        pathToAuthenticationWav: req.body.wavUrl,
        contentLanguage: 'es-CO',
        callback: function(response){
            res.send(response);
        }
    });
});


/* For Facebook Validation */
/* Handling all messenges entered by the user */
app.post('/webhook', (req, res) => {
    console.log("post----->");
    if (req.body.object === 'page') {
        req.body.entry.forEach((entry) => {
            entry.messaging.forEach((event) => {
                userMap.set("sender", event.sender.id);
                console.log("event");
                console.log(event);
                if (event.message && event.message.text) {
                    todo1ChatBot.sendMessage(event.message.text, event.sender.id.toString());
                } else if (event.message && event.message.sticker_id) {
                    todo1ChatBot.sendMessage(event.message.sticker_id, event.sender.id.toString());
                }else if (event.message && event.message.attachments) {
                    todo1ChatBot.sendMessage(event.message.attachments, event.sender.id.toString());
                } else if (event.postback && event.postback.payload === 'getStarted') {
                    todo1ChatBot.sendMessage(event.postback.payload, event.sender.id.toString());
                } else if(event.account_linking) {
                    let msj;
                    if(event.account_linking.status === 'linked'){
                        msj = "Ingreso exitoso 😉! Te encuentras en una zona segura 🔐. Cuando necesites saber qué puedes hacer escríbeme la palabra 'ayuda'";
                    }else if(event.account_linking.status === 'unlinked'){
                        msj = "Tu cuenta ha sido desvinculada.";
                    }else{
                        msj = "Tu cuenta no ha sido reconocidad, por favor intentalo nuevamente";
                    }
                    todo1ChatBot.sendMessage(event.account_linking.authorization_code, event.sender.id.toString());
                    //todo1ChatBot.callbackFacebook(event.sender.id.toString(), { text: msj });
                }else{
                    todo1ChatBot.sendEvent(event.postback.payload, event.sender.id.toString());
                }

            });
        });
        res.status(200).end();
    }
});

/* Webhook for API.ai to get response from the 3rd party API */
app.post('/ai', (req, res) => {
    console.log('*** Webhook for api.ai ***');
    console.log(req.body.result);

    // Validate if user has type unless one time the password: for now with LOCAL STORAGE//
    // -------------------------------------------------------------------------------- //

    //general variables for every action//
    let action = req.body.result.action;
    let sessionId = req.body.sessionId;
    let franquicia = req.body.result.parameters.franquicia_tarjeta;
    let cuenta = req.body.result.parameters.cuenta;
    console.log(req.body.result.contexts.length);
    let confir = ((typeof req.body.result.contexts === 'undefined' || req.body.result.contexts.length === 0) ? '' : req.body.result.contexts[0].parameters.confirm);
    let t = ((typeof req.body.result.fulfillment.messages[0].speech === 'undefined') ? req.body.result.fulfillment.messages.text : req.body.result.fulfillment.messages[0].speech);
    let accounts = todo1ChatBot.listAccount(true);
    let accountsDetail;
    let listAccounts = [];
    let quick_replies = [];
    let error = false;
    //---------------------------------//

    switch (action) {
        case 'input.welcome':
            console.log(action, action);
            return res.json({
                speech: "login",
                displayText: "login",
                messages: {
                    attachment: {
                        type: "template",
                        payload: {
                            template_type: "button",
                            text:req.body.result.fulfillment.messages[0].speech,
                            buttons:[
                                {
                                    type: "account_link",
                                    url: "https://chatbot-todo1.azurewebsites.net/login.html"
                                }
                            ]
                        }
                    }
                },
                source: 'saludo'
            });
        break;
        case 'login':
            console.log('intent login ---->', req.body.result.fulfillment.messages[0].speech);
            return res.json({
                speech: "login",
                displayText: "login",
                messages: {
                    text: req.body.result.fulfillment.messages[0].speech,
                    quick_replies: [
                        {
                            content_type: "text",
                            title: "Ver qué puedo hacer",
                            payload: "ayuda"
                        }
                    ]
                },
                source: 'saludo'
            });
        break;
        case 'logout':
            console.log('intent logout ---->', req.body.result.fulfillment.messages[0].speech);
            return res.json({
                speech: "logout",
                displayText: "logout",
                messages: {
                     attachment: {
                        type: "template",
                        payload: {
                            template_type: "button",
                            text:req.body.result.fulfillment.messages[0].speech,
                            buttons:[
                                {
                                    type: "account_unlink"
                                }
                            ]
                        }
                    }
                },
                source: 'saludo'
            });
        break;
        case 'informacion_seguridad':

            let inf = {
                text: req.body.result.fulfillment.messages[0].speech + '\nFue efectiva mi ayuda? ',
                quick_replies: [
                    { content_type: "text", title: "Si", payload: "informacion_seguridad" },
                    { content_type: "text", title: "No", payload: "informacion_seguridad" }
                ]
            };
            return res.json({
                speech: `texto`,
                displayText: `texto`,
                messages: inf,
                source: 'informacion_seguridad'
            });

        case 'informacion_seguridad_si':
            console.log("informacion_seguridad_si----->");
            let inf_si = {
                text: req.body.result.fulfillment.messages[0].speech,
                quick_replies: [
                    { content_type: "text", title: "Ver que puedo hacer", payload: "informacion_seguridad" }
                ]
            };
            return res.json({
                speech: `texto`,
                displayText: `texto`,
                messages: inf_si,
                source: 'informacion_seguridad'
            });

        case 'ayuda':
            console.log('intent login ---->', req.body.result.fulfillment.speech);
            return res.json({
                speech: req.body.result.fulfillment.speech,
                displayText: req.body.result.fulfillment.speech,
                messages: {
                    attachment: {
                        type: "template",
                        payload: {
                            template_type: "generic",
                            elements: [
                                {
                                    title: "Transferencia",
                                    image_url: "https://chatbot-todo1.azurewebsites.net/images/transferencias.png",
                                    subtitle: "Escribe por ejemplo: Transferir de nómina a mamá 30000 "
                                },
                                {
                                    title: "Consulta de saldo tarjeta de crédito o cuenta de ahorros",
                                    image_url: "https://chatbot-todo1.azurewebsites.net/images/consulta_saldos.png",
                                    subtitle: "Escribe por ejemplo:  saldo de mi tarjeta de crédito visa"
                                },
                                {
                                    title: "Movimientos",
                                    image_url: "https://chatbot-todo1.azurewebsites.net/images/movimientos.png",
                                    subtitle: "Escribe por ejemplo: Movimientos de mi tarjeta de crédito visa "
                                },
                                {
                                    title: "Pago tarjeta de crédito",
                                    image_url: "https://chatbot-todo1.azurewebsites.net/images/pago_tc.png",
                                    subtitle: "Escribe por ejemplo: Pagar tarjeta de crédito visa "

                                },
                                {
                                    title: "Servicios adicionales",
                                    image_url: "https://chatbot-todo1.azurewebsites.net/images/servicios_adicionales_tc_ahorros.png",
                                    subtitle: "Tarjeta de crédito y Cuenta de ahorros",
                                    buttons: [
                                        {
                                            type: "postback",
                                            title: "Tarjeta de Crédito",
                                            payload: "servicios_tc"
                                        },
                                        {
                                            type: "postback",
                                            title: "Cuenta de ahorros",
                                            payload: "servicios_ahorros"
                                        }

                                    ]
                                }
                            ]
                        }
                    }
                },
                source: 'saludo'
            });
        case 'servicios_adicionales':
            return res.json({
                speech: 'texto',
                displayText: 'texto',
                messages: {
                    attachment: {
                        type: "template",
                        payload: {
                            template_type: "generic",
                            elements: [
                                {
                                    title: "Servicios tarjeta de crédito",
                                    image_url: "https://chatbot-todo1.azurewebsites.net/images/servicios_adicionales_tc.png",
                                    subtitle: "Ejemplo: Bloqueo de mi tarjeta de crédito. Quiero ampliar mi cupo",
                                    buttons: [
                                        {
                                            type: "postback",
                                            title: "Bloqueo",
                                            payload: "servicios_tc"
                                        },
                                        {
                                            type: "postback",
                                            title: "Ampliación de cupo",
                                            payload: "servicios_tc"
                                        },
                                        {
                                            type: "postback",
                                            title: "Cancelación",
                                            payload: "servicios_tc"
                                        }

                                    ]
                                },
                                {
                                    title: "Servicios cuenta de ahorros",
                                    image_url: "https://chatbot-todo1.azurewebsites.net/images/servicios_adicionales_ahorros.png",
                                    subtitle: "Ejemplo: Necesito cambiar el plástico de mi tarjeta, Requiero una certificación bancaria.",
                                    buttons: [
                                        {
                                            type: "postback",
                                            title: "cambio de plástico",
                                            payload: "servicios_tc"
                                        },
                                        {
                                            type: "postback",
                                            title: "certificación bancaria",
                                            payload: "servicios_tc"
                                        },
                                        {
                                            type: "postback",
                                            title: " solicitud de cheque de gerencia",
                                            payload: "servicios_tc"
                                        }

                                    ]
                                }
                            ]
                        }
                    }
                },
                source: 'saludo'
            });
        case 'servicios_tc':
            return res.json({
                speech: 'texto',
                displayText: 'texto',
                messages: {
                    attachment: {
                        type: "template",
                        payload: {
                            template_type: "generic",
                            elements: [
                                {
                                    title: "Servicios tarjeta de crédito",
                                    image_url: "https://chatbot-todo1.azurewebsites.net/images/servicios_adicionales_tc.png",
                                    subtitle: "Ejemplo: Bloqueo de mi tarjeta de crédito. Quiero ampliar mi cupo",
                                    buttons: [
                                        {
                                            type: "postback",
                                            title: "Bloqueo",
                                            payload: "servicios_tc"
                                        },
                                        {
                                            type: "postback",
                                            title: "Ampliación de cupo",
                                            payload: "servicios_tc"
                                        },
                                        {
                                            type: "postback",
                                            title: "Cancelación",
                                            payload: "servicios_tc"
                                        }

                                    ]
                                }
                            ]
                        }
                    }
                },
                source: 'saludo'
            });    
        case 'transferencia':
            console.log("**** req.body *****", req.body.result);
            let aFrom;
            let aTo;
            let accountFrom = ((typeof req.body.result.contexts[0].parameters.cuenta_origen.number === 'undefined') ? req.body.result.contexts[0].parameters.cuenta_origen : req.body.result.contexts[0].parameters.cuenta_origen.number.toString());
            let accountTo = ((typeof req.body.result.contexts[0].parameters.cuenta_destino.number === 'undefined') ? req.body.result.contexts[0].parameters.cuenta_destino : req.body.result.contexts[0].parameters.cuenta_destino.number.toString());
            let amount = ((typeof req.body.result.contexts[0].parameters.monto === 'object') ? req.body.result.contexts[0].parameters.monto.number.format(0, 3, ',', '.') : '');
            if (accountFrom === '') {
                let accounts = todo1ChatBot.getAccount("ahorros", true);
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
                    speech: req.body.result.fulfillment.messages[0].speech,
                    displayText: req.body.result.fulfillment.messages[0].speech,
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
            break;
        case 'consulta_saldos':
            let tp_acc = req.body.result.contexts[0].parameters.tipo_tarjeta;
            let txt_search;
            if (tp_acc === 'credito' || tp_acc === 'tarjeta') {
                accounts = todo1ChatBot.getAccount("tc", true);
                txt_search = "💳🤔 De cuál tarjeta de crédito?";
            } else if (tp_acc === 'ahorros' || tp_acc === 'cuenta') {
                accounts = todo1ChatBot.getAccount("ahorros", true);
                txt_search = "💳🤔 De cuál cuenta deseas información?";
            } else {
                txt_search = "💳🤔 De cuál cuenta o tarjeta de crédito deseas información?";
            }
            if (cuenta !== '') {
                let oneAccount = todo1ChatBot.getAccount(cuenta.toLowerCase(), true);
                if (oneAccount.length > 0) {
                    let tipoCuenta = oneAccount[0].type;
                    if (tipoCuenta === "tc") {
                        accountsDetail = todo1ChatBot.listAccountDetail(accounts[0].id);
                        txt = 'Tu tarjeta de crédito ' + oneAccount[0].alias.capitalize() + ' *' + oneAccount[0].id + ':\nPago mínimo: ' + accountsDetail[0].pagoMinimo + '\nFecha de pago: ' + accountsDetail[0].fechaPago + '\nPago total: ' + accountsDetail[0].pagoTotal + '\nCupo disponible: ' + accountsDetail[0].disponibleAvances;
                        quick_replies.push({ content_type: "text", title: "Pago mínimo "+oneAccount[0].alias.capitalize(), payload: "pagos" });
                        quick_replies.push({ content_type: "text", title: "Pago total "+oneAccount[0].alias.capitalize(), payload: "pagos" });
                        quick_replies.push({ content_type: "text", title: "¿Qué más puedo hacer?", payload: "ayuda" });
                    } else {
                        txt = 'El saldo de tu cuenta *' + oneAccount[0].id + ' es: $' + oneAccount[0].saldo;
                        quick_replies.push({ content_type: "text", title: "¿Qué más puedo hacer?", payload: "ayuda" });
                    }
                } else {
                    txt = 'No he podido encontrar tu cuenta ' + cuenta + '. Por favor ingrésala de nuevo';
                    quick_replies.push({ content_type: "text", title: "¿Qué más puedo hacer?", payload: "ayuda" });
                }
                return res.json({
                    speech: txt,
                    displayText: txt,
                    messages: {
                        text: txt,
                        quick_replies: quick_replies
                    },
                    source: 'saludo'
                });
            } else if (franquicia === '') {
                console.log("Sin franquicia ------>");

                if (accounts.length > 1) {
                    for (key in accounts) {
                        if (accounts[key].type !== 'tc') {
                            listAccounts.push({ content_type: "text", title: accounts[key].type + " " + accounts[key].id, payload: "consulta_saldos" });
                        } else {
                            listAccounts.push({ content_type: "text", title: accounts[key].id, image_url: "https://chatbot-todo1.azurewebsites.net/images/" + accounts[key].alias + ".png", payload: "consulta_saldos" });
                        }
                    }
                    return res.json({
                        speech: txt_search,
                        displayText: txt_search,
                        messages: {
                            text: txt_search,
                            quick_replies: listAccounts
                        },
                        source: 'saludo'
                    });
                } else {
                    let txt;
                    if (accounts[0].type === "tc") {
                        accountsDetail = todo1ChatBot.listAccountDetail(accounts[0].id);
                        txt = 'Tarjeta de crédito ' + accounts[0].alias.capitalize() + ' *' + accounts[0].id + ':\nPago mínimo: $' + accountsDetail[0].pagoMinimo + '\nFecha de pago: ' + accountsDetail[0].fechaPago + '\nPago total: $' + accountsDetail[0].pagoTotal + '\nCupo disponible: $' + accountsDetail[0].disponibleAvances;
                        quick_replies.push({ content_type: "text", title: "Pago mínimo "+accounts[0].alias.capitalize(), payload: "pagos" });
                        quick_replies.push({ content_type: "text", title: "Pago total "+accounts[0].alias.capitalize(), payload: "pagos" });
                        quick_replies.push({ content_type: "text", title: "¿Qué más puedo hacer?", payload: "ayuda" });
                    } else {
                        txt = 'El saldo de tu cuenta *' + accounts[0].id + ' es: $' + accountsDetail[0].saldo;
                        quick_replies.push({ content_type: "text", title: "¿Qué más puedo hacer?", payload: "ayuda" });
                    }
                    return res.json({
                        speech: txt,
                        displayText: txt,
                        messages: {
                            text: txt,
                            quick_replies: quick_replies
                        },
                        source: 'saludo'
                    });
                }
            } else {
                console.log("Con franquicia --------->", franquicia);
                if (franquicia === 'object') {
                    franquicia = franquicia.number;
                }
                accounts = todo1ChatBot.getAccount(franquicia.replace(/\s/g, ''), true);

                if (accounts.length > 1) {
                    for (key in accounts) {
                        listAccounts.push({ content_type: "text", title: accounts[key].type + " " + accounts[key].id, payload: "consulta_saldos" });
                    }
                    return res.json({
                        speech: txt_search,
                        displayText: txt_search,
                        messages: {
                            text: txt_search,
                            quick_replies: listAccounts
                        },
                        source: 'saludo'
                    });
                } else {
                    let txt;
                    console.log("accounts -------------->", accounts);
                    if(accounts[0].type === 'ahorros'){
                        txt = 'El saldo de tu cuenta *' + accounts[0].id + ' es: $' + accounts[0].saldo;
                        quick_replies.push({ content_type: "text", title: "¿Qué más puedo hacer?", payload: "ayuda" });
                    }else{
                        accountsDetail = todo1ChatBot.listAccountDetail(accounts[0].id);
                        txt = 'Tarjeta de crédito ' + accounts[0].alias.capitalize() + ' *' + accounts[0].id + ':\nPago mínimo: $' + accountsDetail[0].pagoMinimo + '\nFecha de pago: ' + accountsDetail[0].fechaPago + '\nPago total: $' + accountsDetail[0].pagoTotal + '\nCupo disponible: $' + accountsDetail[0].disponibleAvances;
                        quick_replies.push({ content_type: "text", title: "Pago mínimo "+accounts[0].alias.capitalize(), payload: "pagos" });
                        quick_replies.push({ content_type: "text", title: "Pago total "+accounts[0].alias.capitalize(), payload: "pagos" });
                        quick_replies.push({ content_type: "text", title: "¿Qué más puedo hacer?", payload: "ayuda" });
                    }
                    return res.json({
                        speech: txt,
                        displayText: txt,
                        messages: {
                            text: txt,
                            quick_replies:quick_replies
                        },
                        source: 'saludo'
                    });
                        
                }
            }
        case 'parameters_saldos':
            let tipo = req.body.result.contexts[0].parameters.tipo_tarjeta;
            let num_tarjeta = req.body.result.contexts[0].parameters.numero_tarjeta;

            /*if (tipo === 'undefined' || tipo === '') {
                return res.json({
                    speech: `texto`,
                    displayText: `texto`,
                    messages: {
                        text: req.body.result.fulfillment.messages[0].speech,
                        quick_replies: [
                            {
                                content_type: "text",
                                title: "Tarjeta de crédito",
                                payload: "parameters_saldos"
                            },
                            {
                                content_type: "text",
                                title: "Cuenta de ahorros",
                                payload: "parameters_saldos"
                            }
                        ]
                    },
                    source: 'saludo'
                });
            } else */
            if (num_tarjeta === 'undefined' || num_tarjeta === '') {
                let accounts = todo1ChatBot.listAccount(true);
                for (key in accounts) {
                    listAccounts.push({ content_type: "text", title: accounts[key].id, payload: "consulta_saldos" });
                }
                return res.json({
                    speech: req.body.result.fulfillment.messages[0].speech,
                    displayText: req.body.result.fulfillment.messages[0].speech,
                    messages: {
                        text: req.body.result.fulfillment.messages[0].speech,
                        quick_replies: listAccounts
                    },
                    source: 'saludo'
                });
            } else {
                console.log("consulta saldos final---------> ", tipo);
                let txt;
                listAccounts = todo1ChatBot.getAccount(num_tarjeta.toString(), true);
                let accountsDetail = todo1ChatBot.listAccountDetail(listAccounts[0].id);
                if (listAccounts[0].type === 'tc') {
                    txt = 'Tarjeta de crédito ' + listAccounts[0].alias.capitalize() + ' *' + listAccounts[0].id + ':\nPago mínimo: $' + accountsDetail[0].pagoMinimo + ' \n Fecha de pago: ' + accountsDetail[0].fechaPago + '\n Pago total: $' + accountsDetail[0].pagoTotal + ' \n Cupo disponible: $' + accountsDetail[0].disponibleAvances;
                    quick_replies.push({ content_type: "text", title: "Pago mínimo "+listAccounts[0].alias.capitalize(), payload: "pagos" });
                    quick_replies.push({ content_type: "text", title: "Pago total "+listAccounts[0].alias.capitalize(), payload: "pagos" });
                    quick_replies.push({ content_type: "text", title: "¿Qué más puedo hacer?", payload: "ayuda" });
                } else {
                    accountsDetail = todo1ChatBot.getAccount(num_tarjeta.toString(), true);
                    txt = 'El saldo de tu cuenta *' + num_tarjeta + ' es: $' + accountsDetail[0].saldo;
                    quick_replies.push({ content_type: "text", title: "¿Qué más puedo hacer?", payload: "ayuda" });
                }
                return res.json({
                    speech: txt,
                    displayText: txt,
                    messages: {
                        text: req.body.result.fulfillment.messages[0].speech + ' \n ' + txt,
                        quick_replies:quick_replies
                    },
                    source: 'saludo'
                });
            }
        case 'pagos':
            console.log("**** Intent pagos ******");
            let pago_tipo = req.body.result.contexts[0].parameters.pago_tipo;
            let debito = req.body.result.contexts[0].parameters.cuenta_origen;
            let message;
            let speech;
            let getPay;
            let cuentaPagar;
            let cuentaPago;
            quick_replies = [];
            franquicia = req.body.result.contexts[0].parameters.franquicia_tarjeta;
            if ((pago_tipo !== 'undefined' && pago_tipo !== '') && (franquicia !== 'undefined' && franquicia !== '')) {
                cuentaPagar = todo1ChatBot.findAccount(cleanedString(franquicia.toString()), true);
                if (typeof cuentaPagar === 'undefined') {
                    console.log("**** retorno cuenta pagar fallo *****");
                    error = true;
                } else {
                    if (debito === 'undefined' || debito === '') {
                        console.log("Cuenta de ahorros PAGOS");
                        accounts = todo1ChatBot.getAccount("ahorros", true);
                        for (key in accounts) {
                            quick_replies.push({ content_type: "text", title: accounts[key].type + " " + accounts[key].alias, payload: "pagos" })
                        }
                        speech = req.body.result.fulfillment.messages[0].speech;
                        message = {
                            text: req.body.result.fulfillment.messages[0].speech,
                            quick_replies: quick_replies
                        };
                    } else if (confir === 'undefined' || confir === '') {
                        cuentaPago = todo1ChatBot.findAccount(cleanedString(debito.toString()), true);
                        if (typeof cuentaPago === 'undefined') {
                            console.log("**** retorno cuenta pago fallo *****");
                            error = true;
                        } else {
                            accounts = todo1ChatBot.getAccount(franquicia.toString(), true);
                            accountsDetail = todo1ChatBot.listAccountDetail(accounts[0].id);
                            let val = ((pago_tipo === 'total') ? accountsDetail[0].pagoTotal : accountsDetail[0].pagoMinimo)
                            speech = "Ok, quieres realizar el pago " + pago_tipo + " por $" + val + " de tu tarjeta de crédito " + accounts[0].alias + " desde tu cuenta de ahorros "+debito+"?";
                            message = {
                                text: "Ok, quieres realizar el pago " + pago_tipo + " por $" + val + " de tu tarjeta de crédito " + accounts[0].alias + " desde tu cuenta de ahorros "+debito+"?",
                                quick_replies: [
                                    {
                                        content_type: "text",
                                        title: "Si",
                                        payload: "pagos"
                                    },
                                    {
                                        content_type: "text",
                                        title: "No",
                                        payload: "pagos"
                                    }
                                ]
                            };
                        }
                    } else {
                        if (req.body.result.contexts[0].parameters.valid_confirm === "1") {
                            speech = "Pago " + pago_tipo + " realizado. \n  Deseas realizar alguna otra operación?";
                            message = {
                                text: "Pago " + pago_tipo + " realizado. \n  Deseas realizar alguna otra operación?",
                                quick_replies: [
                                    {
                                        content_type: "text",
                                        title: "Saldo "+debito,
                                        payload: "pagos"
                                    },
                                    {
                                        content_type: "text",
                                        title: "¿Qué más puedo hacer?",
                                        payload: "ayuda"
                                    }
                                ]
                            };
                        } else {
                            speech = "Ok, la operación no fue ejecutada, quedó cancelada. \n Deseas realizar alguna otra operación?";
                            message = {
                                text: "Ok, la operación no fue ejecutada, quedó cancelada. \n Deseas realizar alguna otra operación?",
                                quick_replies: [
                                    {
                                        content_type: "text",
                                        title: "¿Qué más puedo hacer?",
                                        payload: "ayuda"
                                    }
                                ]
                            };
                        }
                        todo1ChatBot.cancelContext(sessionId);
                    }
                }
            } else {
                if (franquicia === 'undefined' || franquicia === '') {
                    console.log("Franquicia ")
                    accounts = todo1ChatBot.getAccount("tc", true);
                    for (key in accounts) {
                        listAccounts.push({ content_type: "text", title: accounts[key].id, payload: "pagos", image_url: "https://chatbot-todo1.azurewebsites.net/images/" + accounts[key].alias + ".png" });
                    }
                    speech = req.body.result.fulfillment.messages[0].speech;
                    message = {
                        text: req.body.result.fulfillment.messages[0].speech,
                        quick_replies: listAccounts
                    };
                } else if (pago_tipo === 'undefined' || pago_tipo === '') {
                    cuentaPagar = todo1ChatBot.findAccount(cleanedString(franquicia.toString()), true);
                    if (typeof cuentaPagar === 'undefined') {
                        console.log("**** retorno cuenta pagar fallo *****");
                        error = true;
                    } else {
                        speech = req.body.result.fulfillment.messages[0].speech;
                        message = {
                            text: req.body.result.fulfillment.messages[0].speech,
                            quick_replies: [
                                {
                                    content_type: "text",
                                    title: "Mínimo",
                                    payload: "pagos"
                                },
                                {
                                    content_type: "text",
                                    title: "Total",
                                    payload: "pagos"
                                }
                            ]
                        };
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
                        speech: "Qué más deseas hacer?",
                        displayText: "Qué más deseas hacer?",
                        messages: {
                            text: "Qué más deseas hacer?",
                            quick_replies: quick_replies
                        },
                        source: 'saludo'
                    });
                }, 2000);
            } else {
                return res.json({
                    speech: speech,
                    displayText: speech,
                    messages: message,
                    source: 'pagos'
                });
            }
            break;
        case 'movimientos':
            console.log("hola movimientos");
            movements.movements(res, req);
            break;
        case 'menu':
            return res.json({
                speech: "Menu",
                displayText: "Menu",
                messages: {
                    attachment: {
                        type: "template",
                        payload: {
                            template_type: "generic",
                            elements: [
                                {
                                    title: "Menu",
                                    buttons: [
                                        {
                                            type: "postback",
                                            title: "Transferencias",
                                            payload: "transferencia"
                                        },
                                        {
                                            type: "postback",
                                            title: "Consulta de Saldos",
                                            payload: "saldo"
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                },
                source: 'menu'
            });
    }

});

function cleanedString(data) {
    data = data.replace(/á/gi, "a");
    data = data.replace(/é/gi, "e");
    data = data.replace(/í/gi, "i");
    data = data.replace(/ó/gi, "o");
    data = data.replace(/ú/gi, "u");
    data = data.replace(/ñ/gi, "n");

    return data;

}

function formatDate(date) {
    var monthNames = [
        "enero", "Febrero", "Marzo",
        "abril", "Mayo", "Junio", "Julio",
        "Agosto", "Septiembre", "Octubre",
        "Novimbre", "Dicimbre"
    ];

    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();

    return day + ' ' + monthNames[monthIndex] + ' ' + year;
}

function formatTime(date) {

    var hours = date.getHours().toString();
    var minutes = date.getMinutes().toString();
    var seconds = date.getSeconds().toString();

    if(hours.length === 1){
        hours = "0"+hours;
    }

    if(minutes.length === 1){
        minutes = "0"+minutes;
    }

    if(seconds.length === 1){
        seconds = "0"+seconds;
    }

    return hours + ':' + minutes + ':' + seconds;
}

Number.prototype.format = function(n, x, s, c) {
    var number = parseInt(this);
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\D' : '$') + ')',
        num = number.toFixed(Math.max(0, ~~n));
    
    return (c ? num.replace('.', c) : num).replace(new RegExp(re, 'g'), '$&' + (s || ','));
};

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}