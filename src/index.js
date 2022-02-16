const express = require("express");
const server = express();
const { v4: uuid } = require("uuid");

server.use(express.json());

let customers = [];

// MIDDLEWARE
function existCustomer (request, response, next) {
    const { cpf: cpfParams } = request.params;
    const { cpf: cpfBody } = request.body;

    let findCustomer;

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

server.post("/customers", existCustomer ,(request, response) => {
    const { cpf, name } = request.body;

    const isExistsCustomer = customers.some((customer) => customer.cpf === cpf);

    if (isExistsCustomer) {
        return response.status(400).json({ error: "Customer already registered!" })
    }

    const newCustomer = {
        _id: uuid(),
        cpf,
        name,
        statement: []
    }
    customers.push(newCustomer);
    return response.status(201).json({ message: "Customer created succesfully" })
});

server.get("/statements/:cpf", existCustomer, (request, response) => {
    const { findCustomer } = request;
    // const { cpf } = request.params;
    // const numberCpf = Number(cpf);

    // const findCustomer = customers.find(customer => customer.cpf === numberCpf);

    // if (!findCustomer) {
    //     return response.status(404).json({ error: "Customer not found!" });
    // }

    return response.status(200).json({ data: findCustomer.statement });
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

    console.log(payload)

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

    // customers = customers.map(customer => {
    //     if (customer.cpf === findCustomer.cpf) {
    //         return {
    //             ...findCustomer
    //         }
    //     } else {
    //         return customer
    //     }
    // })

    return response.status(200).json({ message: "Deposit made successfully!" }); 
})

server.listen(3066, callback);

function callback (error) {
    if (error) {
        console.error("Error starting server:", error);
        return;
    }
    
    console.log("Server started successfully!")
}