'use strict'; 
const alexa = require('alexa-sdk');

var handlers = {
    "Card_payment": function(){
        let intObj = this.event.request.intent;;
    },
    
}

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context, callback);
    alexa.registerHandlers(handlers);
};