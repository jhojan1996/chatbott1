const messageRecording = "Escuchando...";
const messageCouldntHear = "No pude oirte, ¿Puedes decirlo de nuevo?";
const messageInternalError = "Oh no! Ha habido un error interno, inténtalo nuevamente";
const messageSorry = "Lo siento, no tengo una respuesta a esto";

var $speechInput,
    $recBtn,
    $recordBtn,
    $stopRec,
    recognition,
    audio_context,
    recorder,
    spokenResponse,
    hasEnroll = false,
    audio_stream;

$(document).ready(function() {
    //Con esta linea checkeamos si el browser tiene activo el permiso de usar microfono//
    Initialize();
    //--------------------------------------------------------------------------------//

    $speechInput = $("#speech");
    $recBtn = $("#rec");
    $recordBtn = $("#save-rec");
    $stopRec = $("#save-rec-stop");

    $recBtn.on("click", (event)=> switchRecognition());

    $(".debug__btn").on("click", function() {
        $(this).next().toggleClass("is-active");
        return false;
    });

    $recordBtn.on("click",()=>{
        spokenResponse = `Por favor repite la siguiente frase: Todo uno presente en la feria Bancolombia`;
        respond(spokenResponse, ()=>startRecording());
    });

    $stopRec.on("click", function(){
        const _AudioFormat = "audio/wav";
        stopRecording(_AudioFormat)
            .then(blob=> saveFile(blob))
            .then(response=>{
                if(!hasEnroll){
                    return createEnrollmentByWavURL(response.url);
                }else{
                    return authentication(response.url);
                }
            })
            .catch((err)=>{
                console.log(err);
            });
    });

    $("#del_enroll").on("click",function(){
        getEnrollments()
            .then(response=>{
                let l = response.Result.length;
                for (let i = 0; i < l; i++) {
                    deleteEnrollment(response.Result[i]);
                }
            })
            .catch(err=>console.log(err));
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
    
        let text = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
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
    send(text);
}
function updateRec() {
    $recBtn.text(recognition ? "PARAR" : "HABLAR");
}
function send(text) {
    $.ajax({
        type: "POST",
        url: `${process.env.BASE_URL}query?v=${process.env.V}`,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        headers: {
            "Authorization": `Bearer ${process.env.DEVELOPER_TOKEN}`
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
    const debugJSON = JSON.stringify(val, undefined, 2);
    const intent = val.result.metadata.intentName;
    if(intent === "initial_intent"){
        getEnrollments()
            .then(response=>{
                const l = response.Result.length;
                if(l < 3){
                    spokenResponse = `Hola. Para poder ayudarte necesito registrar tu voz. Por favor, presiona el botón grabar para iniciar el reconocimiento`;  
                }else{
                    hasEnroll = true;
                    spokenResponse = `Hola. ¿En qué puedo ayudarte?`;   
                }
                respond(spokenResponse);
                debugRespond(debugJSON);
            })
            .catch(err=>console.log(err));
    }else{
        console.log("HAS ENROLL====>",hasEnroll);
        spokenResponse = val.result.fulfillment.speech;
        if(!hasEnroll){
             getEnrollments()
                .then(response=>{
                    const l = response.Result.length;
                    if(l >= 3){
                        hasEnroll =  true;
                    }
                })
                .catch(err=>console.log(err));
        }
        spokenResponse = val.result.fulfillment.speech;
        respond(spokenResponse);
        debugRespond(debugJSON);         
    }
}
function debugRespond(val) {
    $("#response").text(val);
}
function respond(val, callback="") {
    if (val == "") {
        val = messageSorry;
    }
    if (val !== messageRecording) {
        window.utterances = [];
        const msg = new SpeechSynthesisUtterance();
        msg.voiceURI = "native";
        msg.text = val;
        msg.lang = "es-CO";
        msg.onstart = event=>{
            console.log("Empece a hablar");
        };
        msg.onend = event=>{
            console.log("termine de hablar");
            if(typeof callback === 'function'){
                console.log("Ya puedes empezar a hablar");
                callback();
            }
        };
        window.utterances.push(msg);
        window.speechSynthesis.speak(msg);
    }
    $("#spokenResponse").addClass("is-active").find(".spoken-response__text").html(val);
}

/* CODIGO PARA GENERAR LA URL DEL WAV */
function Initialize() {
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
        window.URL = window.URL || window.webkitURL;
        audio_context = new AudioContext;
        console.log('Audio context is ready !');
        console.log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
    } catch (e) {
        alert('No web audio support in this browser!');
    }
}

function startRecording() {
    console.log("inicie startRecording");
    navigator.getUserMedia({ audio: true }, function (stream) {
        audio_stream = stream;
        const input = audio_context.createMediaStreamSource(stream);
        console.log('Media stream succesfully created');
        recorder = new Recorder(input);
        console.log('Recorder initialised');
        recorder && recorder.record();
        console.log('Recording...');

        setTimeout(()=>{
            $stopRec.trigger("click");
        },5000);

    }, function (e) {
        console.error('No live audio input: ' + e);
    });
}

function stopRecording(AudioFormat) {
    recorder && recorder.stop();
    console.log('Stopped recording.');
    audio_stream.getAudioTracks()[0].stop();

    return new Promise((resolve, reject)=>{
        recorder && recorder.exportWAV(function (blob) {
            recorder.clear();
            resolve(blob);
        }, (AudioFormat || "audio/wav"));
    });
}

function getEnrollments(){
    return new Promise((resolve, reject)=>{
         $.ajax({
            url: "https://chatbot-todo1.azurewebsites.net/getEnrollments",
            method: "POST",
            data:{
                userId: "developerUserId",
                password: "d0CHipUXOk"
            },
            success:(data)=>{
                const d = JSON.parse(data);
                if(d.ResponseCode === "SUC"){
                    resolve(d);
                }else{
                    reject(new Error(`Se produjo en error en la petición: ${d.ResponseCode}`));
                }
            }
        });
    });      
}

function deleteEnrollment(id_delete){
    return new Promise((resolve, reject)=>{
        $.ajax({
            url: "https://chatbot-todo1.azurewebsites.net/deleteEnrollment",
            method: "POST",
            data:{
                userId: "developerUserId",
                password: "d0CHipUXOk",
                enrollmentId: id_delete
            },
            success:(data)=>{
                console.log("Enrollment borrado");
            }
        });
    });
}

function createEnrollmentByWavURL(wavUrl){
    $.ajax({
        url: "https://chatbot-todo1.azurewebsites.net/createEnrollmentByWavURL",
        method: "POST",
        data:{
            userId: "developerUserId",
            password: "d0CHipUXOk",
            urlToEnrollmentWav: wavUrl
        },
        success:(data)=>{
            const d = JSON.parse(data);
            let spk;
            if(d.ResponseCode === "SUC"){
                getEnrollments()
                    .then(response=>{
                        const l = response.Result.length;
                        spokenResponse = (l < 3) ? `Inscripción exitosa, debe realizar ${3-l} más para terminar el reconocimiento. Por favor, presiona el botón grabar.` : `He reconocido tu voz correctamente. ¿En qué puedo ayudarte?`;
                        respond(spokenResponse);
                    })
                    .catch(err=>console.log(err));
            }else{
                spokenResponse = `La inscripción falló. Por favor, inténtalo de nuevo`;
                respond(spokenResponse);
            }
        }
    });
}

function authentication(wavUrl){
    $.ajax({
        url: "https://chatbot-todo1.azurewebsites.net/authentication",
        method: "POST",
        data:{
            userId: "developerUserId",
            password: "d0CHipUXOk",
            urlToAuthenticationWav: wavUrl
        },
        success:(data)=>{
            const d = JSON.parse(data);
            if(d.ResponseCode === "SUC"){
                const txt = `auth_true`;
                send(txt);
            }else{
                spokenResponse = `Tu voz no fue reconocida. Por favor, inténtalo de nuevo`;
                respond(spokenResponse);
            }
        }
    });
}

function saveFile(name){
    console.log("BLOB IN FUNCTION =====>",name);

    var fd = new FormData();
    fd.append('fname', 'test2.wav');
    fd.append('data', name);


    return new Promise((resolve, reject)=>{
        $.ajax({
            url: "https://backend-chatbott1.azurewebsites.net/api/api.php",
            method: "POST",
            data: fd,
            processData: false,
            contentType: false,
            success:(data)=>{
                const d = JSON.parse(data);
                if(d.status === "200"){
                    resolve(d);
                }else{
                    reject(new Error(`Se produjo en error en la petición: ${d.ResponseCode}`));
                }
            }
        });
    });
}