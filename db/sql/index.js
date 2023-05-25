const { Pool } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
dotenv.config();

// Create new client
const pool = new Pool({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
  port: process.env.port,
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 0
});

module.exports.client = pool;

// connect to client and remove all dbs
const clearDB = async() => {
  return pool.connect()
  .then((client) => {
    client.query('DROP TABLE IF EXISTS products, reviews, photos, ratings, characteristics_reviews, characteristics;')
    .then(() => client.release())
  })
  // .catch((err) => {
  //   console.log('Could not clear database, error is:', err.stack)
  // })
}

const createDB = () => {
  return pool.connect()
  .then((client) => {
    client.query('CREATE TABLE reviews (id INT PRIMARY KEY, product_id INT, rating INT, date BIGINT, summary VARCHAR(10000), body VARCHAR(10000), recommend BOOL, reported BOOL default FALSE, reviewer_name VARCHAR(100), reviewer_email VARCHAR(100), response VARCHAR(300), helpfulness INT default 1);\
    CREATE TABLE photos(id INT PRIMARY KEY, review_id INT REFERENCES reviews(id), url VARCHAR(1000));\
    CREATE TABLE characteristics (id INT PRIMARY KEY, product_id INT, name VARCHAR(200), total_votes INT DEFAULT 0, average NUMERIC);\
    CREATE TABLE characteristics_reviews(id INT PRIMARY KEY, characteristic_id INT REFERENCES characteristics(id), value INT);')
    .then(() => client.release())
  })
  .catch((err) => console.log(err.stack))
}

let reviews = [];
const seedReviewData = async() => {
  pool.connect()
  .then((client) => {
    client.query('COPY reviews FROM ' + path.join(__dirname, `../../../../Downloads/reviews.csv`) + ' DELIMITER "," CSV HEADER')
    .then(() => {
      console.log('reviews finished copying');
      client.release();
    })
  })

  // fs.createReadStream(path.join(__dirname, `../../../../Downloads/reviews.csv`))
  // .pipe(csv())
  // .on('data', (data) => {
  //   reviews.push(Object.values(data));
  // })
  // .on('end', () => {
  //   console.log('done');
  //   pool.query('INSERT INTO reviews (id, product_id, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)', reviews)
  //   .then(() => pool.release())
  // })
}


clearDB()
.then(() => createDB())
.then(() => parsecsv('characteristics'))
.then(() => seedReviewData())




const parsecsv = (filename) => {
    // let resultsArr = [];
    fs.createReadStream(path.join(__dirname, `../../../../Downloads/${filename}.csv`))
    .pipe(csv())
    .on('data', (data) => {
      pool.connect()
      .then((client) => {
        client.query('INSERT INTO characteristics (id, product_id, name) VALUES ($1, $2, $3)', Object.values(data))
        .then(() => {
          client.release();
        })
      })
    })
    .on('end', () => {
      console.log(`successfully parsed ${filename} data`);

  });
}


