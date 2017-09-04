'use strict'; 
const alexa = require('alexa-sdk');

var handlers = {
    "Card_payment": function(){
        
    },
    
}

exports.handler = function(event, context, callback) {
  let firstName = event.result.parameters['given-name'];
  let lastName = event.result.parameters['last-name'];
  
  let options = searchPeopleRequestOptions(firstName, lastName);
  
  makeRequest(options, function( data, error) {
    let person = data.results[0];
    if (person) {
        let height = person.height;
        let response = person.name + " is " + height + " centimeters tall.";
        callback(null, {"speech": response});
    }
    else {
        callback(null, {"speech": "I'm not sure!"});
    }
  });
};
 
function searchPeopleRequestOptions(firstName, lastName) {
    return {
        host: starWarsAPI,
        path: `/api/people/?search=`+firstName+'+'+lastName
    };
}
 
function makeRequest(options, callback) {
    var request = http.request(options, 
    function(response) {
        var responseString = '';
        response.on('data', function(data) {
            responseString += data;
        });
         response.on('end', function() {
            var responseJSON = JSON.parse(responseString);
            callback(responseJSON, null);
        });
    });
    request.end();
}