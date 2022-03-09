const express = require("express");
const server = express();
const { v4: uuid } = require("uuid");

server.use(express.json());

let customers = [];

// MIDDLEWARE
function existCustomer (request, response, next) {
    const { cpf: cpfParams } = request.params;
    const { cpf: cpfBody } = request.body;
    const { cpf: cpfHeader } = request.headers;

    let findCustomer;

    if (cpfHeader) {
        const numberCpf = Number(cpfHeader);
        findCustomer = customers.find(customer => customer.cpf === numberCpf);
        if (!findCustomer) {
            return response.status(404).json({ error: "Customer not found!" });
        }
        request.customer = findCustomer;
    }

    if (cpfParams) {
        const numberCpf = Number(cpfParams);
        findCustomer = customers.find(customer => customer.cpf === numberCpf);
        if (!findCustomer) {
            return response.status(404).json({ error: "Customer not found!" });
        }
        request.findCustomer = findCustomer;
    }

    if (cpfBody && typeof cpfBody !== "number") {
        return response.status(400).json({ error: "The CPF field must be a number!" })
    }

    if (cpfBody) {
        findCustomer = customers.some((customer) => customer.cpf === cpfBody);
        if (findCustomer) {
            return response.status(400).json({ error: "Customer already registered!" })
        }
    }

    return next();
}

function getBalance (statement) {
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === 'credit') {
            return acc + operation.amount;
        } else if (operation.type === 'debit') {
            return acc - operation.amount;
        }
    }, 0);
    return balance;
}

server.post("/customers", existCustomer ,(request, response) => {
    const { cpf, name } = request.body;

    const newCustomer = {
        _id: uuid(),
        cpf,
        name,
        statement: []
    }
    customers.push(newCustomer);
    return response.status(201).send();
});

server.get("/statement", existCustomer, (request, response) => {
    const { customer } = request;

    return response.status(200).json(customer.statement);
})

server.post("/deposit/:cpf", existCustomer, (request, response) => {
    const { findCustomer } = request;
    const { description, amount, type } = request.body;
    const payload = {
        description, 
        amount,
        type,
        createdAt: new Date()
    }

    if (!payload.amount) {
        return response.status(422).json({ error: "The value field needs to be sent in scope!" })
    }

    if (!payload.type) {
        return response.status(422).json({ error: "The type field needs to be sent in scope!" })
    }

    if (typeof payload.type !== "string") {
        return response.status(400).json({ error: "The type field must be a String!" })
    }

    if (payload.type !== "credit") {
        return response.status(400).json({ error: "The type field must be a 'deposit'!" })
    }

    if (typeof payload.amount !== "number") {
        return response.status(400).json({ error: "The value field must be a number!" })
    }

    findCustomer.statement.push(payload);
    return response.status(200).json({ message: "Deposit made successfully!" }); 
})

server.post("/withdraw", existCustomer, (request, response) => {
    const { amount } = request.body;
    const customer= request.customer;
    const balance = getBalance(customer.statement);

    if (amount > balance) {
        return response.status(400).json({ error: "Insufficient funds!" })
    }

    const payload = {
        amount,
        type: "debit",
        createdAt: new Date()
    }
    customer.statement.push(payload);
    return response.status(201).json({ message: "Withdrawal successfully paid!" })
})

server.get("/customer", existCustomer, (request, response) => {
    const { customer }  = request;
    return response.status(200).json(customer);
})

server.put("/customer/:cpf", existCustomer, (request, response) => {
    const { findCustomer }  = request;
    const { name = null, cpf=null } = request.body;

    if (!name && !cpf) {
        return response.status(400).json({ message: "There was no data to change" });
    }

    if (name) {
        findCustomer.name = name;
    }

    if (cpf) {
        findCustomer.cpf = cpf;
    }

    return response.status(200).json({ message: "Successfully changed data", new_data: findCustomer });
})

server.delete("/customer/:cpf", existCustomer, (request, response) => {
    const { findCustomer }  = request;
    customers = customers.filter((customer) => customer._id !== findCustomer._id);
    return response.status(200).json({ message: "Customer deleted successfully!", new_data: customers })
})

server.get("/customers", (request, response) => {
    if (!customers.length) {
        return response.status(404).json({ error: "No customer found!" })
    }

    return response.status(200).json(customers);
})

server.listen(3333, callback);

function callback (error) {
    if (error) {
        console.error("Error starting server:", error);
        return;
    }
    
    console.log("Server started successfully!")
}