const Accounts = require('../modelAccounts');

exports.pagos = (res, req)=>{
	console.log("***** Pagos ********");
	const tc = Accounts.listAccTC(true);
	let franquicia = (typeof req.body.result.contexts[0].parameters.franquicia !== 'undefined') ? req.body.result.contexts[0].parameters.franquicia : '';
	let tipo_pago = (typeof req.body.result.contexts[0].parameters.tipo_pago !== 'undefined') ? req.body.result.contexts[0].parameters.tipo_pago : '';
	let confirm = (typeof req.body.result.contexts[0].parameters.confirm_pago !== 'undefined') ? req.body.result.contexts[0].parameters.confirm_pago : '';
	let response;
	let text;

	if(franquicia){
		console.log("Franquicia obtenida ====>",franquicia);
		let account = Accounts.getAccount(franquicia, true);
		let accountDetail = Accounts.listAccountDetail(account[0].id);
		if(tipo_pago){
			if(confirm){
				console.log("La confirmacion fue obtenida =======>",confirm);
				text = (confirm === 'si' || confirm === 'si') ? `El pago ${tipo_pago} de tu tarjeta de credito ${franquicia} terminada en ${account[0].id} fue realizado con exito` : `Pago no realizado, ¿qué mas deceas hacer?`;				
				response = {
					text: text
				};
			}else{
				let totxmin = (tipo_pago === 'minimo') ? accountDetail[0].pagoMinimo : accountDetail[0].pagoTotal;
				text = `Ok, quires realizar el pago ${tipo_pago} por $ ${totxmin} de tu tarjeta de crédito ${franquicia} terminada en ${account[0].id}`
				response = {
					text: text
				};	
			}
		}else{
			console.log("El tipo de pago no fue ingresado");
		}
	}else{
		console.log("La franquicia no fue enviada");
	}

	return res.json({
	    speech: text,
	    displayText: text,
	    messages: response,
	    source: 'pagos'
	});
}