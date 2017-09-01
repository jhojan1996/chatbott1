var accessToken = "b774636399634896af8b43567d942df7",
    developerToken = "8a03cac054a24cfa9538ae6dd1243723",
    baseUrl = "https://api.api.ai/v1/",
    v = "20170516",
    $speechInput,
    $recBtn,
    $recordBtn,
    $stopRec,
    recognition,
    audio_context,
    recorder,
    spokenResponse,
    hasEnroll = false,
    audio_stream,
    messageRecording = "Escuchando...",
    messageCouldntHear = "No pude oirte, ¿Puedes decirlo de nuevo?",
    messageInternalError = "Oh no! Ha habido un error interno, intentalo nuevamente",
    messageSorry = "Lo siento, no tengo una respuesta a esto";

$(document).ready(function() {
    //Con esta linea checkeamos si el browser tiene activo el permiso de usar microfono//
    Initialize();
    //--------------------------------------------------------------------------------//

    $speechInput = $("#speech");
    $recBtn = $("#rec");
    $recordBtn = $("#save-rec");
    $stopRec = $("#save-rec-stop");

    $speechInput.keypress(function(event) {
        if (event.which == 13) {
            event.preventDefault();
            send();
        }
    });
    $recBtn.on("click", (event)=> switchRecognition());

    $(".debug__btn").on("click", function() {
        $(this).next().toggleClass("is-active");
        return false;
    });

    $recordBtn.on("click",()=>{
        spokenResponse = `Por favor di: never forget tomorrow is a new day`;
        $.when(respond(spokenResponse)).done(startRecording());
    });

    $stopRec.on("click", function(){
        var _AudioFormat = "audio/wav";
        stopRecording(function(AudioBLOB){
            var url = URL.createObjectURL(AudioBLOB);
            var li = document.createElement('li');
            var au = document.createElement('audio');
            var hf = document.createElement('a');
            var fileName = new Date().toISOString() + '.wav';


            var blobToBase64 = function(blob, cb) {
                var reader = new FileReader();
                reader.onload = function() {
                    var dataUrl = reader.result;
                    var base64 = dataUrl.split(',')[1];
                    cb(base64);
                };
                reader.readAsDataURL(blob);
            };

           
            console.log("audio BLOB", AudioBLOB);

            saveFile(AudioBLOB, data=>{console.log(data);});

            //saveFile(AudioBLOB);


            au.controls = true;
            au.src = url;
            hf.href = url;
            hf.download = new Date().toISOString() + '.wav';
            hf.innerHTML = hf.download;
            li.appendChild(au);
            li.appendChild(hf);
            document.getElementById("recordingslist").appendChild(li);
        }, _AudioFormat);
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
    recognition.lang = "es-CO";
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
        success: (data)=>{
            prepareResponse(data);
        },
        error: ()=>{
            respond(messageInternalError);
        }
    });
}
function prepareResponse(val) {
    let debugJSON = JSON.stringify(val, undefined, 2);
    let intent = val.result.metadata.intentName;
    if(intent === "default-welcome-intent"){
        getEnrollments(data=>{
            let r = JSON.parse(data);
            console.log("Datos del ajax ====> ",r);
            if(r.ResponseCode === "SUC"){
                let l = r.Result.length;
                if(l < 3){
                    spokenResponse = `Usted tiene ${l} inscripciones, debe realizar ${3-l} para completar.`;
                }else{
                    hasEnroll = true;
                    spokenResponse = `Ya puede proceder a realizar la autenticación.`;
                }
            }
            $recBtn.prop("disabled", true);
            $recordBtn.prop("disabled", false);
            spokenResponse += ` Por favor presione el botón grabar para iniciar la inscripción`;
            respond(spokenResponse);
            debugRespond(debugJSON);
        });
    }else{
        spokenResponse = val.result.fulfillment.speech;
        respond(spokenResponse);
        debugRespond(debugJSON);
    }
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
        msg.lang = "es-CO";
        window.speechSynthesis.speak(msg);
    }
    $("#spokenResponse").addClass("is-active").find(".spoken-response__text").html(val);
}

/* CODIGO PARA GENERAR LA URL DEL WAV */
function Initialize() {
    try {
        // Monkeypatch for AudioContext, getUserMedia and URL
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
        window.URL = window.URL || window.webkitURL;

        // Store the instance of AudioContext globally
        audio_context = new AudioContext;
        console.log('Audio context is ready !');
        console.log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
    } catch (e) {
        alert('No web audio support in this browser!');
    }
}

function startRecording() {
    console.log("inicie startRecording");
    // Access the Microphone using the navigator.getUserMedia method to obtain a stream
    navigator.getUserMedia({ audio: true }, function (stream) {
        // Expose the stream to be accessible globally
        audio_stream = stream;
        // Create the MediaStreamSource for the Recorder library
        var input = audio_context.createMediaStreamSource(stream);
        console.log('Media stream succesfully created');

        // Initialize the Recorder Library
        recorder = new Recorder(input);
        console.log('Recorder initialised');

        // Start recording !
        recorder && recorder.record();
        console.log('Recording...');

        // Disable Record button and enable stop button !
        $recordBtn.prop("disabled", true);
        $stopRec.prop("disabled", false);
    }, function (e) {
        console.error('No live audio input: ' + e);
    });
}

function stopRecording(callback, AudioFormat) {
    // Stop the recorder instance
    recorder && recorder.stop();
    console.log('Stopped recording.');

    // Stop the getUserMedia Audio Stream !
    audio_stream.getAudioTracks()[0].stop();

    // Disable Stop button and enable Record button !
    $recordBtn.prop("disabled", false);
    $stopRec.prop("disabled", true);

    // Use the Recorder Library to export the recorder Audio as a .wav file
    // The callback providen in the stop recording method receives the blob
    if(typeof(callback) == "function"){

        /**
         * Export the AudioBLOB using the exportWAV method.
         * Note that this method exports too with mp3 if
         * you provide the second argument of the function
         */
        recorder && recorder.exportWAV(function (blob) {
            callback(blob);

            // create WAV download link using audio data blob
            // createDownloadLink();

            // Clear the Recorder to start again !
            recorder.clear();
        }, (AudioFormat || "audio/wav"));
    }
}

function getEnrollments(callback){
    $.ajax({
        url: "https://chatbot-todo1.azurewebsites.net/getEnrollments",
        method: "POST",
        data:{
            userId: "developerUserId",
            password: "d0CHipUXOk"
        },
        success:(data)=>{
            callback(data);
        }
    });
}

function createEnrollmentByWavURL(wavUrl, callback){
    $.ajax({
        url: "https://chatbot-todo1.azurewebsites.net/createEnrollmentByWavURL",
        method: "POST",
        data:{
            userId: "developerUserId",
            password: "d0CHipUXOk",
            urlToEnrollmentWav: wavUrl
        },
        success:(data)=>{
            callback(data);
        }
    }); 
}

function authentication(wavUrl, callback){
    $.ajax({
        url: "https://chatbot-todo1.azurewebsites.net/authentication",
        method: "POST",
        data:{
            userId: "developerUserId",
            password: "d0CHipUXOk",
            urlToEnrollmentWav: wavUrl
        },
        success:(data)=>{
            callback(data);
        }
    }); 
}

function saveFile(name, callback){
    console.log("BLOB IN FUNCTION =====>",name);

    var fd = new FormData();
    fd.append('fname', 'test2.wav');
    fd.append('data', name);

    $.ajax({
        url: "https://backend-chatbott1.azurewebsites.net/api/api.php",
        method: "POST",
        data: fd,
        processData: false,
        contentType: false,
        success:(data)=>{
            callback(data);
        }
    });
}