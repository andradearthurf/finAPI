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

  const id = uuidv4(); // irá gerar o nosso 'id', que será um uuid

  // a função push() insere dados dentro do array
  customers.push({
    cpf,
    name,
    id,
    statement: []
  });

  return response.status(201).send(); // só para dizer que deu tudo certo 
  
});

app.listen(3333);
