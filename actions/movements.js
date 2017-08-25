const Accounts = require('../modelAccounts');

exports.movements = function (res, req) {
  console.log('------->movimientos');
  let listTC = Accounts.listAccTC(true)
  let message;
  let quick_replies = [];
  let text = '';
  let tc;
  let unique_text = '';
  let cuentaOrigen = req.body.result.parameters['cuenta-origen'];

  if (cuentaOrigen) {
    console.log('cuentaOrigen 1 ------->', cuentaOrigen);
    let queryTarjeta;
    if (cuentaOrigen.number) {
      tc = Accounts.getAccount(cuentaOrigen.number.toString(), true);
      queryTarjeta = cuentaOrigen.number.toString();
    } else if (cuentaOrigen) {
      console.log('cuentaOrigen 2 ------->', cuentaOrigen);
      tc = Accounts.getAccount(cuentaOrigen, true);
      queryTarjeta = tc[0].id;
    }

    console.log('queryTarjeta ------->', queryTarjeta);
    if (Accounts.isAccount(queryTarjeta)) {
      let listMovements = Accounts.getMovements(queryTarjeta);
      console.log('movimientos list ------->', listMovements);
      if (listMovements.length > 0) {

        text = req.body.result.fulfillment.messages[0].speech + '\n';
        for (let key in listMovements) {
          text += listMovements[key].fecha + ' ' + listMovements[key].descriptcion + ' $' + listMovements[key].valor + '.\n';
        }

      } else {
        text = "No tiene movimientos para esa tarjeta";

      }
      quick_replies = [
        {
          content_type: "text",
          title: 'Pago mínimo '+tc[0].alias,
          payload: "pago_tc"
        },
        {
          content_type: "text",
          title: 'Pago Total '+tc[0].alias,
          payload: "pago_tc"
        },
        {
          content_type: "text",
          title: '¿Qué más puedo hacer?',
          payload: "Ayuda"
        }
      ]

    } else {
      text = 'La información de la tarjeta de crédito no coincide.\nDe cuál tarjeta de crédito requieres información?';

      for (let key in listTC) {
        quick_replies.push({ content_type: "text", title: listTC[key].id, payload: "transferencia", image_url: `https://chatbot-todo1.herokuapp.com/${listTC[key].alias}.png` });
      }
    }

    message = {
      text: text,
      quick_replies: quick_replies
    }

  } else {
    console.log('cuenta origen -------> vacio ', listTC.length);
    if (listTC.length === 1) {

      let listMovements = Accounts.getMovements(listTC[0].id);
      text = req.body.result.fulfillment.messages[0].speech + '\n';
      for (key in listMovements) {
        text += listMovements[key].fecha + ' ' + listMovements[key].descriptcion + ' $' + listMovements[key].valor + '.\n';
      }
      quick_replies = [
        {
          content_type: "text",
          title: 'Pago mínimo '+istTC[0].alias,
          payload: "pago_tc"
        },
        {
          content_type: "text",
          title: 'Pago Total '+istTC[0].alias,
          payload: "pago_tc"
        },
        {
          content_type: "text",
          title: '¿Qué más puedo hacer?',
          payload: "Ayuda"
        }
      ]

    } else if (listTC.length > 1) {

      if (Accounts.isAccount(req.body.result.resolvedQuery)) {
        tc = Accounts.getAccount(req.body.result.resolvedQuery, true);
        let listMovements = Accounts.getMovements(req.body.result.resolvedQuery);
        if (listMovements.length > 0) {

          text = 'Tus movimientos más recientes son:' + '\n';
          for (let key in listMovements) {
            text += listMovements[key].fecha + ' ' + listMovements[key].descriptcion + ' $' + listMovements[key].valor + '.\n';
          }

        }
        quick_replies = [
          {
            content_type: "text",
            title: 'Pago mínimo '+tc[0].alias,
            payload: "pago_tc"
          },
          {
            content_type: "text",
            title: 'Pago Total '+tc[0].alias,
            payload: "pago_tc"
          },
          {
            content_type: "text",
            title: '¿Qué más puedo hacer?',
            payload: "Ayuda"
          }
        ]

      } else {

        quick_replies = [];
        for (let key in listTC) {
          quick_replies.push({ content_type: "text", title: listTC[key].id, payload: "movimientos", image_url: `https://chatbot-todo1.herokuapp.com/${listTC[key].alias}.png` });
        }
        text = req.body.result.fulfillment.messages[0].speech;
      }


    } else {
      text = 'No posees tarjetas de crédito'
      quick_replies = [
        {
          content_type: "text",
          title: '¿Qué más puedo hacer?',
          payload: "Ayuda"
        }
      ]
    }

    message = {
      text: text,
      quick_replies: quick_replies
    }
  }

  return res.json({
    speech: text,
    displayText: text,
    messages: message,
    source: 'movimientos'
  });

}