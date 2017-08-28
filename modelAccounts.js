/* ***** lista de cuentas ***** */
var accounts = [
  {
    type: "ahorros",
    alias: "mi cuenta",
    id: "2345",
    saldo: "530.000",
    propia: true
  },
  {
    type: "ahorros",
    alias: "mama",
    id: "1234",
    saldo: 0,
    propia: false
  },
  {
    type: "ahorros",
    alias: "transporte",
    id: "6789",
    saldo: 0,
    propia: false
  },
  {
    type: "ahorros",
    alias: "juan",
    id: "5678",
    saldo: 0,
    propia: false
  },
  {
    type: "ahorros",
    alias: "Personal",
    id: "4567",
    saldo: "245.000",
    propia: true
  },
  {
    type: "tc",
    alias: "visa",
    id: "6614",
    saldo: "245.000",
    propia: true
  },
  {
    type: "tc",
    alias: "mastercard",
    id: "9078",
    saldo: "245.000",
    propia: true
  }

];

/* ***** detalle de las cuentas ***** */
var details = [
  {
    id: "6614",
    deuda: "1.560.000",
    disponibleAvances: "2.300.000",
    disponibleTotal: "2.300.000",
    fechaPago: "2017/05/31",
    pagoMinimo: "00",
    pagoTotal: "00",
    otroValor: "00"
  },
  {
    id: "9078",
    deuda: "4.260.000",
    disponibleAvances: "2.300.000",
    disponibleTotal: "2.300.000",
    fechaPago: "2017/05/20",
    pagoMinimo: "00",
    pagoTotal: "00",
    otroValor: "00"
  }
];

/* ***** movimientos de las tarjetas de credito ***** */
var movements = [
  {
    idProducto: "6614",
    fecha: "2017/05/10",
    descriptcion: "Retiro cajero",
    valor: "100"
  },
  {
    idProducto: "6614",
    fecha: "2017/05/11",
    descriptcion: "Compra exito",
    valor: "387"
  },
  {
    idProducto: "6614",
    fecha: "2017/05/12",
    descriptcion: "Restaurante J&C",
    valor: "246"
  },
  {
    idProducto: "9078",
    fecha: "2017/05/12",
    descriptcion: "Retiro cajero",
    valor: "70"
  },
  {
    idProducto: "9078",
    fecha: "2017/05/12",
    descriptcion: "Compras Jumbo",
    valor: "146"
  }
];

function isAccount(id) {

  let list = accounts.filter((element) => {
    return element.id === id
  });
  
  if (list.length > 0) {
    return true;
  } else {
    return false;
  }

}

function listAcc(criterion) {
  let list = accounts.filter((element) => {
    return element.propia === criterion
  });

  return list;
}

function listAccTC(criterion) {
  let list = accounts.filter((element) => {
    return element.propia === criterion && element.type === 'tc'
  });

  return list;
}

function getAccount(txt, criterion) {
  let list = accounts.filter((element) => {
    return element.id === txt && element.propia === criterion;
  });

  if (list.length === 0) {
    list = accounts.filter((element) => {
      return element.alias === txt && element.propia === criterion;
    });
  }

  if (list.length === 0) {
    list = accounts.filter((element) => {
      return element.type === txt && element.propia === criterion;
    });
  }

  return list;
}

function listAccountDetail(id) {

  let listDetail = details.filter((element) => {
    return element.id === id
  });

  return listDetail;
}

function getMovements(id) {
  console.log("tipo id---->", typeof id);
  let listMovements = movements.filter((elm) => {
    return elm.idProducto === id
  });

  return listMovements;
}



module.exports = {
  account: accounts,
  isAccount: isAccount,
  detail: details,
  movement: movements,
  listAcc: listAcc,
  listAccTC: listAccTC,
  listAccountDetail: listAccountDetail,
  getAccount: getAccount,
  getMovements: getMovements

};

