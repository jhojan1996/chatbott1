'use strict'; 
const alexa = require('alexa-sdk');

var handlers = {
    "Card_payment": function(){
        let intObj = this.event.request.intent;
        if(!intObj.slots.payment_actionslot.value){
            let slotToElicit = 'payment_actionslot';
            let speechOutput = 'What would you like to do?';
            let repromptSpeech = speechOutput;
            this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
        }else if(!intObj.slots.payment_typeslot.value){
            let slotToElicit = 'payment_typeslot';
            let speechOutput = 'What kind of payment do you want to do?';
            let repromptSpeech = speechOutput;
            this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
        }else if(!intObj.slots.franchiseslot.value){
            let slotToElicit = 'payment_typeslot';
            let speechOutput = 'Do you want the full or minimun payment?';
            let repromptSpeech = speechOutput;
            this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);
        }else if(intObj.slots.payment_typeslot.confirmationStatus !== 'CONFIRMED'){
            if(intObj.slots.payment_typeslot.confirmationStatus !== 'DENIED'){
                var slotToConfirm = 'payment_typeslot';
                var speechOutput = 'Do really want to generate the '+intObj.slots.payment_typeslot.value+' payment of your credit card?';
                var repromptSpeech = speechOutput;
                this.emit(':confirmSlot', slotToConfirm, speechOutput, repromptSpeech);
            }
        }else{
            this.emit(':tell', 'Ok. The payment has been done successfully');
        }
    }    
}

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context, callback);
    alexa.registerHandlers(handlers);
};