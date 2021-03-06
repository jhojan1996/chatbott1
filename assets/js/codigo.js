const messageRecording = "Escuchando...";
const messageCouldntHear = "No pude oirte, ¿Puedes decirlo de nuevo?";
const messageInternalError = "Oh no! Ha habido un error interno, inténtalo nuevamente";
const messageSorry = "Lo siento, no tengo una respuesta a esto";
const accessToken = "b774636399634896af8b43567d942df7";
const developerToken = "8a03cac054a24cfa9538ae6dd1243723";
const baseUrl = "https://api.api.ai/v1/";
const v = "20170516";
const resp = "TODO1 presente en la feria bancolombia"

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

    //Controlar donde inicia el demo//
    getEnrollments()
        .then(response=>{
            const l = response.Result.length;
            if(l < 3){
                changeTip(`Por favor presiona el botón "Hablar" y pronuncia lo siguiente: <span class="tips__tip"><i>Iniciar demo</i></span>`);
            }else{
                hasEnroll = true;
                changeTip(`Por favor utilice la siguiente frase para realizar una transacción: Realizar el pago mínimo de mi tarjeta de crédito visa.`);
            }
        })
        .catch(err=>console.log(err));
    //-----------------------------//

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
        $(".rec-button").css("fill", "#F44646");
        $(".timer").css("color", "#F44646");
        startRecording();
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
                location.reload();
            })
            .catch(err=>console.log(err));
    });

});
function startRecognition() {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = function(event) {
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
    setConv(text, 'user');
    if(text === 'si' || text === 'sí'){
        $(".current").animate({
            opacity: 0
        }, 1000, function(){
            $(".current").css("display", "none");
            $(".record").css("display", "block");
            $(".record").animate({
                opacity: 1
            }, 1000);
        });
    }

    send(text);
}
function updateRec() {
    $recBtn.text(recognition ? "PARAR" : "HABLAR");
}
function send(text) {
    $.ajax({
        type: "POST",
        url: `${baseUrl}query?v=${v}`,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        headers: {
            "Authorization": `Bearer ${developerToken}`
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
    let dialog = val.result.resolvedQuery;
    if(intent === "initial_intent"){
        getEnrollments()
            .then(response=>{
                const l = response.Result.length;
                if(l < 3){
                    spokenResponse = `Hola, que gusto tenerte con nosotros. Para poder ayudarte necesito registrar tu voz. Por favor, presiona el botón grabar y repite la siguiente frase: Todo uno presente en la feria bancolombia.`;
                    changeTip(`Resultados de las grabaciones: <br/>`);
                    $(".current").animate({
                        opacity: 0
                    }, 1000, function(){
                        $(".current").css("display", "none");
                        $(".record").css("display", "block");
                        $(".record").animate({
                            opacity: 1
                        }, 1000);
                    });
                }else{
                    hasEnroll = true;
                    spokenResponse = `Hola. ¿En qué puedo ayudarte?`;
                }
                respond(spokenResponse);
            })
            .catch(err=>console.log(err));
    }else{
        if(intent === "transferencia" || intent === "pago_tarjeta" || intent === "pago_tarjeta_confirm" || intent === "transferencia_confirm"){
            if(dialog === 'si' || dialog=== 'sí'){
                changeTip(`Presiona el botón grabar y repite la siguiente frase: Todo uno presente en la feria bancolombia.`);
            }else{
                changeTip(`Por favor presiona el botón "Hablar" y pronuncia lo siguiente: <span class="tips__tip"><i>Si</i></span>`);
            }                
        }else if(intent ==="auth_transfer"){
            changeTip(`Para terminar el demo por favor repita: <span class="tips__tip"><i>Hasta luego</i></span>`);
        }else{
            changeTip(`Por favor presiona el botón "Hablar" y pronuncia lo siguiente: <span class="tips__tip"><i>Transferir 500 dolares a la cuenta mamá</i></span>`);
        }
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
    }
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
   //AQUI IBA LA LLAMADA AL METODO NUEVO
   setConv(val, 'bnk1');
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

        let seconds = 4;
        let display = document.querySelector('#timer');
        startTimer(seconds, display);
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
            let txt;
            if(d.ResponseCode === "SUC"){
                getEnrollments()
                    .then(response=>{
                        const l = response.Result.length;
                        txt = `Resultado de la grabación ${l}: Exitosa`;
                        changeTipWithSus(txt, l);
                        if(l < 3){
                            spokenResponse = `Inscripción exitosa, debe realizar ${3-l} más para terminar el reconocimiento. Por favor, presiona el botón grabar y repite la siguiente frase: todo uno presente en la feria Bancolombia`;
                        }else{
                            spokenResponse = `He reconocido tu voz correctamente. ¿En qué puedo ayudarte?`;
                            $(".record").animate({
                                opacity: 0
                            }, 1000, function(){
                                $(".record").css("display", "none");
                                $(".current").css("display", "block");
                                $(".current").animate({
                                    opacity: 1
                                }, 1000);
                            });
                            changeTip(`Por favor utilice la siguiente frase para realizar una transacción: Realizar el pago mínimo de mi tarjeta de crédito visa.`);
                        }
                        respond(spokenResponse);
                    })
                    .catch(err=>console.log(err));
            }else{
                txt = `Resultado de la grabación: Fallida`;
                changeTipWithSus(txt, 1);
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
                changeTip(`El reconocimiento fue exitoso<br/>Por favor utilice la siguiente frase para realizar otra transacción: Transferir 500 dolares a la cuenta mamá`);
                $(".record").animate({
                    opacity: 0
                }, 1000, function(){
                    $(".record").css("display", "none");
                    $(".current").css("display", "block");
                    $(".current").animate({
                        opacity: 1
                    }, 1000);
                });
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

function changeTip(text){
    $(".tips__text").html(text)
}

function changeTipWithSus(text, l){
    if(l == 1 || l == 0) $(".tips__text").html("");
    let txt = $(".tips__text").html();
    $(".tips__text").html(`${txt} <br/> ${text}`);
}

function stopRec(){
    const _AudioFormat = "audio/wav";
    $(".rec-button").css("fill", "#9EC9DA");
    $(".timer").css("color", "#9EC9DA");
    setConv('TODO1 presente en la feria bancolombia', 'user')
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
}

function startTimer(duration, display) {
    var timer = duration, minutes, seconds;
    var int = setInterval(function () {
        minutes = parseInt(timer / 60, 10)
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            clearInterval(int);
            stopRec();
        }
    }, 1000);
}

function setConv(text, who){
    let div = document.createElement("div");
    let msg = (who == 'user')?'Usted':'Bank1';
    let cls = (who == 'user')?'user_text':'machine_text';
    let container = document.getElementById("history__text");
    div.classList.add(cls);
    div.innerHTML = `${msg}: ${text}`;
    container.insertBefore(div, container.firstChild);
}