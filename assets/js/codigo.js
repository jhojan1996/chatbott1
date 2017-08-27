var accessToken = "d9ee0ae9d4244f06984494103b3d7271",
developerToken = "4884d96f37ba401ea46e3e2a80597f56",
baseUrl = "https://api.api.ai/v1/",
v = "20170516",
$speechInput,
$recBtn,
recognition,
messageRecording = "Escuchando...",
messageCouldntHear = "No pude oirte, ¿Puedes decirlo de nuevo?",
messageInternalError = "Oh no! Ha habido un error interno, intentalo nuevamente",
messageSorry = "Lo siento, no tengo una respuesta a esto";
$(document).ready(function() {
  $speechInput = $("#speech");
  $recBtn = $("#rec");
  $speechInput.keypress(function(event) {
    if (event.which == 13) {
      event.preventDefault();
      send();
    }
  });
  $recBtn.on("click", function(event) {
    switchRecognition();
  });
  $(".debug__btn").on("click", function() {
    $(this).next().toggleClass("is-active");
    return false;
  });
});
function startRecognition() {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.onstart = function(event) {
    respond(messageRecording);
    updateRec();
  };
  recognition.onresult = function(event) {
    recognition.onend = null;
    
    var text = "";
    for (var i = event.resultIndex; i < event.results.length; ++i) {
      text += event.results[i][0].transcript;
    }
    setInput(text);
    stopRecognition();
  };
  recognition.onend = function() {
    respond(messageCouldntHear);
    stopRecognition();
  };
  recognition.lang = "es-ES";
  recognition.start();
}

function stopRecognition() {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
  updateRec();
}
function switchRecognition() {
  if (recognition) {
    stopRecognition();
  } else {
    startRecognition();
  }
}
function setInput(text) {
  $speechInput.val(text);
  send();
}
function updateRec() {
  $recBtn.text(recognition ? "Stop" : "Speak");
}
function send() {
  var text = $speechInput.val();
  $.ajax({
    type: "POST",
    url: baseUrl + "query?v="+v,
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    headers: {
      "Authorization": "Bearer " + developerToken
    },
    data: JSON.stringify({query: text, lang: "es", sessionId: "yaydevdiner"}),
    success: function(data) {
      prepareResponse(data);
    },
    error: function() {
      respond(messageInternalError);
    }
  });
}
function prepareResponse(val) {
  var debugJSON = JSON.stringify(val, undefined, 2),
  spokenResponse = val.result.fulfillment.speech;
  respond(spokenResponse);
  debugRespond(debugJSON);
}
function debugRespond(val) {
  $("#response").text(val);
}
function respond(val) {
  if (val == "") {
    val = messageSorry;
  }
  if (val !== messageRecording) {
    var msg = new SpeechSynthesisUtterance();
    msg.voiceURI = "native";
    msg.text = val;
    msg.lang = "es-ES";
    window.speechSynthesis.speak(msg);
  }
  $("#spokenResponse").addClass("is-active").find(".spoken-response__text").html(val);
}