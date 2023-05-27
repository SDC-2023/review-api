const express = require('express');
const { pool, prepareDB} = require('./db/sql/index.js');
const reviewRouter = require('./routes/Routes.js');
require('dotenv').config();


// uncomment to seed your db
// prepareDB(pool); // reset, recreate, and reseed database

const app = express();

app.use(express.json());
app.use('/api', reviewRouter);

const port = process.env.SERVERPORT || 3000;

app.listen(port, () => {
  console.log(`server listening on ${port}`)
})