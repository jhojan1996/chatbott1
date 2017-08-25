module.exports = {
  users: [
    {
      id: 1,
      username: "juan",
      password: "1234567",
      name: "Juan"
    }
  ],
  accounts: [
    {
      type: "ahorros",
      alias: "nomina",
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
      alias: "personal",
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

  ],
  details: [
    {
      id: "6614",
      deuda: "1.500",
      disponibleAvances: "5.000",
      disponibleTotal: "20.000",
      fechaPago: "Junio 1 de 2017",
      pagoMinimo: "1.000",
      pagoTotal: "1.500",
      otroValor: "00"
    },
    {
      id: "9078",
      deuda: "4.260",
      disponibleAvances: "10.000",
      disponibleTotal: "2.300",
      fechaPago: "Junio 1 de 2017",
      pagoMinimo: "1.500",
      pagoTotal: "3.000",
      otroValor: "00"
    }
  ],
  movements: [
    {
      idProducto: "6614",
      fecha: "2017/05/10",
      descriptcion: "Retiro cajero",
      valor: "100.000"
    },
    {
      idProducto: "6614",
      fecha: "2017/05/11",
      descriptcion: "Compra exito",
      valor: "387.000"
    },
    {
      idProducto: "6614",
      fecha: "2017/05/12",
      descriptcion: "Restaurante J&C",
      valor: "246.000"
    },
    {
      idProducto: "9078",
      fecha: "2017/05/12",
      descriptcion: "Retiro cajero",
      valor: "70.000"
    },
    {
      idProducto: "9078",
      fecha: "2017/05/12",
      descriptcion: "Compras Jumbo",
      valor: "146.000"
    }
  ],
  listAcc: listAcc

};

function listAcc(criterion) {
  console.log("entro modelo------>")
  let list = []

  return list;
}