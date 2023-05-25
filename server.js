const express = require('express');
const { pool, prepareDB} = require('./db/sql/index.js')
require('dotenv').config();

prepareDB(pool); // reset, recreate, and reseed database

const app = express();

app.use(express.json());

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`server listening on ${port}`)
})