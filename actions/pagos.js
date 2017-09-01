const Accounts = require('../modelAccounts');

exports.pagos = (res, req)=>{
	console.log("***** Pagos ********");
	const tc = Accounts.listAccTC(true);
	let franquicia = req.body.result.parameters.franquicia;
	let tipo_pago = req.body.result.parameters.tipo_pago;
	let response;
	let text;

	if(franquicia){
		console.log("Franquicia obtenida ====>",franquicia);
		let account = Accounts.getAccount(franquicia, true);
		let accountDetail = Accounts.listAccountDetail(account[0].id);
		if(tipo_pago){
			let totxmin = (tipo_pago === 'minimo') ? accountDetail[0].pagoMinimo : accountDetail[0].pagoTotal;
			text = `Ok, quires realizar el pago ${tipo_pago} por $ ${totxmin} de tu tarjeta de crédito ${franquicia} terminada en ${account[0].id}`
			response = {
				text: `Ok, quires realizar el pago ${tipo_pago} por $ ${totxmin} de tu tarjeta de crédito ${franquicia} terminada en ${account[0].id}`
			};

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