const { request } = require('express');
const express = require('express');
const { v4: uuidv4 } = require("uuid");
const app = express();
app.use(express.json());
const customers = []; // vetor para armazenar temporariamente as contas 
//Middleware
function verifyIfExistesAccountCPF(request, response, next) {
  const {cpf} = request.headers;
  const customer = customers.find((customer) => customer.cpf === cpf); //.find() retorna um objeto 
  if(!customer){
    return response.status(400).json({error: "Conta não localizada por este CPF!"})
  }
  request.customer = customer; // passar o request customer para as rotas que passarem pelo Middleware
  return next();
}
function getBalance(statement){
  const balance = statement.reduce((acc, operation) => { //reduce() função js que recebe dois parametros para calcular
    if(operation.type ===  'credit'){
      return acc + operation.amount
    }else{
      return acc - operation.amount
    }
  }, 0) // a função reduce() inicia valendo 0
  return balance
}
app.post("/account", (request, response) => {
  const {cpf, name } = request.body;
  const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf); // 3 iguais mesmo valor e mesmo tipo 
  if(customerAlreadyExists){ // se encontrar um customer
    return response.status(400).json({error: "Usuario já existe!"})
  }
  customers.push({ 
    cpf,
    name,
    id: uuidv4(),
    statement: []
  });

  return response.status(201).send(); //sen() não retorna informação e sim um status
})
//app.use(verifyIfExistesAccountCPF); // todas as rotas a baixo irão passar por esse Middleware
app.get("/statement", verifyIfExistesAccountCPF, (request, response) => { 
  //se informar a Middleware direto na rota apenas essa ira passar pela Middleware
  const {customer} = request; // recebendo o customer da Middleware
  return response.json(customer.statement);
});
app.post("/deposit", verifyIfExistesAccountCPF, (request, response) => {
  const {description, amount} = request.body;
  const {customer} = request; 
  const statementeOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  };
  customer.statement.push(statementeOperation);
  return response.status(201).send();
});
app.post("/withdraw",verifyIfExistesAccountCPF, (request, response)=>{
  const {amount} = request.body
  const {customer} = request

  const balance = getBalance(customer.statement)

  if (balance < amount){
    return response.status(400).json({error: "Insufficient funds!"})
  }

  const statementeOperation = {
    amount,
    created_at: new Date(),
    type: "debit",
  }

  customer.statement.push(statementeOperation)

  return response.status(201).send()
});
app.get("/statement/date", verifyIfExistesAccountCPF, (request, response) => { 
  const {customer} = request;
  const {date} = request.query;
  
  const dateFormat = new Date(date);

  const statement = customer.statement.filter(
    (statement)=> statement.created_at.toDateString() == new Date(dateFormat).toDateString()
  );
  
  return response.json(statement);
});

app.listen(22222);