const voiceIt = require('VoiceIt');
const Accounts = require('../modelAccounts');

voiceIt.initialize('5cd68e4c391e4c09a5fad1917b4073a5');

exports.pagos = (res, req)=>{
	console.log("***** Pagos ********");
	const tc = Accounts.listAccTC(true);
	const franquicia = (typeof req.body.result.contexts[0].parameters.franquicia !== 'undefined') ? req.body.result.contexts[0].parameters.franquicia : '';
	const tipo_pago = (typeof req.body.result.contexts[0].parameters.tipo_pago !== 'undefined') ? req.body.result.contexts[0].parameters.tipo_pago : '';
	const confirm = (typeof req.body.result.contexts[0].parameters.confirm_pago !== 'undefined') ? req.body.result.contexts[0].parameters.confirm_pago : '';
	const auth = (typeof req.body.result.contexts[0].parameters.valid_auth !== 'undefined') ? req.body.result.contexts[0].parameters.valid_auth : '';
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
				if(confirm === 'si' || confirm === 'si'){
					if(auth){
						text = `Tu voz fue reconocida. El pago fue realizado exitosamente. ¿Puedo ayudarlo en algo mas?`;
						setContext = [{"name":"pago_tarjeta", "lifespan":0, "parameters":{}}];
						response = {
							text: text
						};
						return res.json({
						    speech: text,
						    displayText: text,
						    messages: response,
						    contextOut: setContext,
						    source: 'pagos'
						});
					}else{
						getEnrollments(data=>{
							let ingreso = JSON.parse(data);
							if(ingreso.ResponseCode === "SUC"){
								let l = ingreso.Result.length;
								if(l < 3){
									text = `Usted tiene ${l} inscripciones. Debe realizar ${3-l} para poder realizar la autenticación`;
								}else{
									text = `Por seguridad necesito confirmar tu identidad. Por favor presiona el botón grabar para iniciar el reconocimiento`;
								}
								return res.json({
								    speech: text,
								    displayText: text,
								    messages: response,
								    contextOut: [
										{
											"name":"pago_tarjeta", 
											"lifespan":1, 
											"parameters":{
												"pagar_accion":"pago", 
												"franquicia": franquicia, 
												"tipo_pago": tipo_pago, 
												"confirm": confirm,
												"valid_auth": ""
											}
										}
									],
								    source: 'pagos'
								});
							}
						});												
					}	
				}else{
					text = `Pago no realizado, ¿qué mas deceas hacer?`;
					setContext = [{"name":"pago_tarjeta", "lifespan":0, "parameters":{}}];
					response = {
						text: text
					};
					return res.json({
					    speech: text,
					    displayText: text,
					    messages: response,
					    contextOut: setContext,
					    source: 'pagos'
					});
				}					
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
							"confirm": "",
							"valid_auth": ""
						}
					}
				];
				response = {
					text: text
				};
				return res.json({
				    speech: text,
				    displayText: text,
				    messages: response,
				    contextOut: setContext,
				    source: 'pagos'
				});
			}
		}else{
			console.log("El tipo de pago no fue ingresado");
			text = `¿Deseas realizar el pago minimo o total de tu tarjeta de crédito ${franquicia}?`;
			setContext = [
				{
					"name":"pago_tarjeta", 
					"lifespan":1, 
					"parameters":{
						"pagar_accion":"pago", 
						"franquicia": franquicia, 
						"tipo_pago": "", 
						"confirm": "",
						"valid_auth": ""
					}
				}
			];

			response = {
				text: text
			};
			return res.json({
			    speech: text,
			    displayText: text,
			    messages: response,
			    contextOut: setContext,
			    source: 'pagos'
			});
		}
	}else{
		console.log("La franquicia no fue enviada");
		text = `¿Cual tarjeta de crédito deseas pagar?`;
		setContext = [
			{
				"name":"pago_tarjeta", 
				"lifespan":1, 
				"parameters":{
					"pagar_accion":"pago", 
					"franquicia": "", 
					"tipo_pago": "", 
					"confirm": "",
					"valid_auth": ""
				}
			}
		];
		response = {
			text: text
		};
		return res.json({
		    speech: text,
		    displayText: text,
		    messages: response,
		    contextOut: setContext,
		    source: 'pagos'
		});
	}
}

function getEnrollments(callback){
  voiceIt.getEnrollments({
      userId: "developerUserId",
      password: "d0CHipUXOk",
      callback: function(response){
          callback(response);
      }
  });
}