const { request } = require("express");
const express = require("express");
const {v4: uuidv4} = require("uuid");

const app = express();

app.use(express.json());

const customers = [];

// Middleware (verificação de CPF - account)
function verifyExistsAccountCPF(request, response, next) {
  /**
   * Um middleware recebe esses 3 parâmetros, sendo que o novo (next), define se
  o nosso middleware vai prosseguir com sua operação padrão programada, ou se
  vai para por onde está. Quando acesso uma rota o middleware percorre a rota
  vai para o middleware primeiro e se der certo vai para o next, se não é porque
  não passou nas condições do middleware. 
   */

  const {cpf} = request.headers;

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

  // inserindo informações dentro do request
  request.customer = customer; // como se fosse um return que vai ficar dentro do request

  // se não existir o customer irá dar erro, e se existir ele vai para next.
  return next();

};

// pegar o balanço de valor que possuo na conta, e primeiramente deve-se receber
// o statement dentro da função abaixo.
function getBalance(statement) {
  // o reduce() vai pegar as informações de determinado valor que iremos passar
  // para ela, e vai transformar todas as informações passada para o reduce()
  // em um valor somente. Vamos querer que ela faça o cálculo daquilo que entrou
  // menos o que saiu.

  // acc = variável responsável por armazenar o valor que estamos adicionando ou
  // removendo de dentro do objeto
  const balance = statement.reduce((acc, operation) =>{
    if (operation.type === 'credit'){
      return acc + operation.amount;
    }
    else{
      return acc - operation.amount;
    }
  }, 0) // iniciar o reduce() em 0, valor inicial de amounts

  return balance;
};

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

  return response.status(201).send(); // só para dizer que deu tudo certo.

});

// para usar o middleware, é dessa forma: 
// app.use(verifyExistsAccountCPF);
// (tudo que precisar do middleware para baixo, será usado)

// o método GET irá buscar o extrato bancário e retornar todo o extrato.
app.get("/statement", verifyExistsAccountCPF, (request, response) =>{
  const { customer } = request;
    
  // irá aparecer um extrato "[]", pois o array ainda está vazio
  return response.json(customer.statement);

});

// criando um depósito na conta, fazendo a verificação de uma conta não existente
// através do CPF.
app.post("/deposit", verifyExistsAccountCPF, (request, response) =>{
  const { description, amount } = request.body;

  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit"
  }

  // inserindo dentro do statement, nos customers, as informações de um deposito 
  // vale lembrar que customer é um objeto criado no middleware (copia de customers).
  customer.statement.push(statementOperation);

return response.status(201).send();

});

// realizando o saque, tendo em vista que o CPF deve existir e que não é possível
// sacar um valor que não existe na conta.
app.post("/withdraw", verifyExistsAccountCPF, (request, response) => {
  // recebendo a quantia que quero para realizar o saque
  const {amount} = request.body;
  const {customer} = request;

  // passando o statement para o getBalance()
  const balance = getBalance(customer.statement);
  
  // interrompendo o saque, caso não tenha fundos na minha conta para isso.
  if (amount > balance){
    return response.status(400).json({error: "Insufficient funds!"})
  }

  // colocando o valor debitado no extrato, caso o amount sacado for maior que 
  // meu balance na conta (meu dinheiro em conta).
  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit"
  }

  customer.statement.push(statementOperation);

  return response.status(201).send();

});

// imprimindo um extrato a partir da data do extrato.
app.get("/statement/date", verifyExistsAccountCPF, (request, response) =>{
  const { customer } = request;
    
  // vou receber essa data através do query params, pois faz sentido, o usuário
  // terá que digitar a data que quer buscar.
  const { date } = request.query;

  // com isso faz a busca pelo dia independente da hora que se fez a transação.
  const dateFormat = new Date(date + " 00:00");

  // vamos filtra para apenas retornar para a gente somente os extratos a partir
  // da data que estamos buscando. (dentro de statement, é claro)
  const statement = customer.statement.filter((statement) => 
  statement.created_at.toDateString() === new Date(dateFormat).toDateString())

  // irá retornar um statement caso a data exista.
  return response.json(statement);

});

// dar um update no nome da conta
app.put("/account", verifyExistsAccountCPF, (request, response) =>{
  const {name} = request.body;
  const {customer} = request;

  customer.name = name;

  return response.status(201).send();

});

// imprimindo todas as contas
app.get("/account", verifyExistsAccountCPF, (request, response) =>{
  const {customer} = request;

  return response.json(customer);
});

// deletando uma conta
app.delete("/account", verifyExistsAccountCPF, (request, response) =>{
  const {customer} = request;

  // deletar dentro do array usando o splice(), para ficar um array vazio
  customers.splice(customer, 1);

  // retornar status 200 HTTP e os customers que restaram no nosso array.
  return response.status(200).json(customers);
});

// retornando o balance
app.get("/balance", verifyExistsAccountCPF, (request, response) =>{
  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.json(balance);

});

app.listen(3333);
