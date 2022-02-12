const express = require("express");
const {v4: uuidv4} = require("uuid");

const app = express();

app.use(express.json());

const customers = [];

/**
 * Uma conta irá ter:
 * CPF - string
 * name - string
 * id - uuid
 * statement (extrato) - [] (array) 
 */
app.post("/account", (request, response) => {
  const {cpf, name} = request.body;

  // verificar se já há um CPF existente na nossa aplicação:
  // o some() faz uma busca no array, e retorna apenas um bool.
  const customersAlreadyExists = customers.some(
      (customer) => customer.cpf === cpf
    );
  // se for true, quer dizer que já existe um CPF no nosso array, e logo ele não
  // deverá ser salvo, por fim apresentará uma mensagem de erro.
  if (customersAlreadyExists){
    return response.status(400).json({error: "Customer already exists!"})
  }

  // a função push() insere dados dentro do array.
  customers.push({
    cpf,
    name,
    id: uuidv4(), // irá gerar o nosso 'id', que será um uuid.
    statement: []
  });

  return response.status(201).send(); // só para dizer que deu tudo certo .
});

// o método GET irá buscar o extrato bancário e retornar todo o extrato.
app.get("/statement/:cpf", (request, response) =>{
  const {cpf} = request.params;

  // o find() irá percorrer o devido array e verificar se o CPF do query params já existe no array, e
  // irá retornar o objeto completo, a informação completa (todos os dados)
  // nesse caso, irá retornar todo o array "customers".
  const customer = customers.find((customer) => customer.cpf === cpf);

  // verificar a busca do extrato em uma conta não existente.
  // quando o objeto não vier preenchido.
  if (!customer){
    return response.status(400).json({error: "Customer not found!"})
  }

  // alternativa para verificação:
  // const customerExist = customers.some((customer) => customer.cpf === cpf)
  // if (!customerExist){
  //   return response.status(400).json({error: "Customer not found!"})
  // }

  // irá aparecer um extrato "[]", pois o array ainda está vazio
  return response.json(customer.statement);

});

app.listen(3333);
