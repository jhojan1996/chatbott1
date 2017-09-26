const Accounts = require('../modelAccounts');

exports.payment = (res, req)=>{
	console.log("***** Pagos ********");
	const tc = Accounts.listAccTC(true);
	const franquicia = (typeof req.body.result.contexts[0].parameters.franchise !== 'undefined') ? req.body.result.contexts[0].parameters.franchise : '';
	const tipo_pago = (typeof req.body.result.contexts[0].parameters.payment_type !== 'undefined') ? req.body.result.contexts[0].parameters.payment_type : '';
	const confirm = (typeof req.body.result.contexts[0].parameters.confirm_payment !== 'undefined') ? req.body.result.contexts[0].parameters.confirm_payment : '';
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
				if(confirm === 'yes'){
					text = `Ok. The ${tipo_pago} payment has been done successfully. Please, tell me what else can I do for you?`;
					setContext = [{"name":"card_payment", "lifespan":0, "parameters":{}}];
					response = {
						text: text
					};
					return res.json({
					    speech: text,
					    displayText: text,
					    messages: response,
					    contextOut: setContext,
					    source: 'payment'
					});
				}else{
					text = `The payment has been cancelled. Please, tell me what else can I do for you?`;
					setContext = [{"name":"card_payment", "lifespan":0, "parameters":{}}];
					response = {
						text: text
					};
					return res.json({
					    speech: text,
					    displayText: text,
					    messages: response,
					    contextOut: setContext,
					    source: 'payment'
					});
				}					
			}else{
				let totxmin = (tipo_pago === 'minimo') ? accountDetail[0].pagoMinimo : accountDetail[0].pagoTotal;
				text = `Ok, do you want to make the ${tipo_pago} payment for $ ${totxmin} of your ${franquicia} credit card terminated in ${account[0].id}?`;
				setContext = [
					{
						"name":"card_payment", 
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
				    source: 'payment'
				});
			}
		}else{
			console.log("El tipo de pago no fue ingresado");
			text = `do you want to make the full or minimun payment of your ${franquicia} credit card?`;
			setContext = [
				{
					"name":"card_payment", 
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
			    source: 'payment'
			});
		}
	}else{
		console.log("La franquicia no fue enviada");
		text = `¿Cual tarjeta de crédito deseas pagar?`;
		setContext = [
			{
				"name":"card_payment", 
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
		    source: 'payment'
		});
	}
}