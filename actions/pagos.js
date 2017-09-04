const Accounts = require('../modelAccounts');
const voiceIt = require('VoiceIt');
voiceIt.initialize('5cd68e4c391e4c09a5fad1917b4073a5');

exports.pagos = (res, req)=>{
	console.log("***** Pagos ********");
	const tc = Accounts.listAccTC(true);
	const franquicia = (typeof req.body.result.contexts[0].parameters.franquicia !== 'undefined') ? req.body.result.contexts[0].parameters.franquicia : '';
	const tipo_pago = (typeof req.body.result.contexts[0].parameters.tipo_pago !== 'undefined') ? req.body.result.contexts[0].parameters.tipo_pago : '';
	const confirm = (typeof req.body.result.contexts[0].parameters.confirm_pago !== 'undefined') ? req.body.result.contexts[0].parameters.confirm_pago : '';
	let response;
	let text;
	let setContext;

	if(franquicia){
		console.log("Franquicia obtenida ====>",franquicia);
		let account = Accounts.getAccount(franquicia, true);
		let accountDetail = Accounts.listAccountDetail(account[0].id);
		if(tipo_pago){
			if(confirm){
				console.log("La confirmacion fue obtenida =======>",confirm);
				let respuesta = Accounts.getEnrollments();
				let ingreso = JSON.parse(respuesta);
				if(ingreso.ResponseCode === "SUC"){
					let l = ingreso.Result.length;
					if(l < 3){
						text = `Usted tiene ${l} inscripciones. Debe realizar ${3-l} para poder realizar la autenticación`;
					}else{
						text = `Por seguridad necesito confirmar tu identidad. Por favor repite la siguiente frase: todo uno presente en la feria bancolombia`;
					}
				}else{
					
				}

				text = (confirm === 'si' || confirm === 'si') ? `El pago ${tipo_pago} de tu tarjeta de crédito ${franquicia} terminada en ${account[0].id} fue realizado con exito` : `Pago no realizado, ¿qué mas deceas hacer?`;
				setContext = [{"name":"pago_tarjeta", "lifespan":0, "parameters":{}}];
			}else{
				let totxmin = (tipo_pago === 'minimo') ? accountDetail[0].pagoMinimo : accountDetail[0].pagoTotal;
				text = `Ok, quires realizar el pago ${tipo_pago} por $ ${totxmin} de tu tarjeta de crédito ${franquicia} terminada en ${account[0].id}`;
				setContext = [
					{
						"name":"pago_tarjeta", 
						"lifespan":1, 
						"parameters":{
							"pagar_accion":"pago", 
							"franquicia": franquicia, 
							"tipo_pago": tipo_pago, 
							"confirm": ""
						}
					}
				];
			}
		}else{
			console.log("El tipo de pago no fue ingresado");
			text = `¿Deseas realizar el pago minimo o total de tu tarjeta de credito ${franquicia}?`;
			setContext = [
				{
					"name":"pago_tarjeta", 
					"lifespan":1, 
					"parameters":{
						"pagar_accion":"pago", 
						"franquicia": franquicia, 
						"tipo_pago": "", 
						"confirm": ""
					}
				}
			];
		}
	}else{
		console.log("La franquicia no fue enviada");
		text = `¿Cual tarjeta de credito deseas pagar?`;
		setContext = [
			{
				"name":"pago_tarjeta", 
				"lifespan":1, 
				"parameters":{
					"pagar_accion":"pago", 
					"franquicia": "", 
					"tipo_pago": "", 
					"confirm": ""
				}
			}
		];
	}

	response = {
		text: text
	};	

	if (setContext) {
		return res.json({
		    speech: text,
		    displayText: text,
		    messages: response,
		    contextOut: setContext,
		    source: 'pagos'
		});
	}else{
		return res.json({
		    speech: text,
		    displayText: text,
		    messages: response,
		    source: 'pagos'
		});
	}
}