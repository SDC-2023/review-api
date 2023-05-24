const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

// Create new client
const client = new Client({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
  port: process.env.port
});

client.connect((err) => {
  if (err) {
    console.log(`connection error ${err.stack}`);
    throw new Error (err)
  }
  console.log(`connected to postgres on ${process.env.port}`)
})