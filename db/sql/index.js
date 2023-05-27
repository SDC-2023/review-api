const { Pool } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { from } = require('pg-copy-streams');
const csv = require('csv-parser')
dotenv.config();

// Create new client
const pool = new Pool({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
  port: process.env.dbport,
});

// prepareDB clears database and reinserts the tables
const prepareDB = async(pool) => {

  const upload = (pool, sqlCommand, filename, ...cb) => {
    pool.connect()
      .then((client) => {
        let stream = client.query(from(sqlCommand));
        let fileStream = fs.createReadStream(path.join(__dirname, `../../../../Downloads/${filename}.csv`));
        fileStream.on('error', (error) => console.log(error))
        stream.on('error', (error) => console.log(error));
        stream.on('finish', () => {
          console.log(`Finished uploading ${filename}`);
          if (cb.length) {
            cb.forEach(fn => fn());
          }
        });
        fileStream.pipe(stream);
      })
  }

  try {
    const client = await pool.connect();

    console.log('Deleting all current tables in database...');
    // drop all current tables
    await client.query('DROP TABLE IF EXISTS reviews, reviews_photos, ratings, characteristics_reviews, characteristics;');

    console.log('Reinitializing all tables in database...');
    // tables created are: reviews, reviews_photos, characteristics, characteristics_reviews
    await client.query('CREATE TABLE reviews (id INT PRIMARY KEY, product_id INT, rating INT, date numeric, summary VARCHAR(10000), body VARCHAR(10000), recommend BOOL, reported BOOL default false, reviewer_name VARCHAR(100), reviewer_email VARCHAR(100), response VARCHAR(300), helpfulness INT default 1);\
    CREATE TABLE reviews_photos(id INT PRIMARY KEY, review_id INT REFERENCES reviews(id), url VARCHAR(1000));\
    CREATE TABLE characteristics (id INT PRIMARY KEY, product_id INT, name VARCHAR(200), total_votes INT DEFAULT 0, average NUMERIC DEFAULT 0);\
    CREATE TABLE characteristics_reviews(id INT PRIMARY KEY, characteristic_id INT REFERENCES characteristics(id), review_id INT REFERENCES reviews(id), value NUMERIC);\
    CREATE TABLE ratings (product_id INT PRIMARY KEY, one NUMERIC DEFAULT 0, two NUMERIC DEFAULT 0, three NUMERIC DEFAULT 0, four NUMERIC DEFAULT 0, five NUMERIC DEFAULT 0, recommended INT DEFAULT 0, not_recommended INT DEFAULT 0)');

    console.log('Reseeding all tables in database...');
    const reviewsCommand = 'COPY reviews (id, product_id, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness) FROM STDIN CSV HEADER';
    const photosCommand = 'COPY reviews_photos (id, review_id, url) FROM STDIN CSV HEADER';
    const characteristicsCommand = 'COPY characteristics (id, product_id, name) FROM STDIN CSV HEADER';
    const characteristicsReviewsCommand = 'COPY characteristics_reviews (id, characteristic_id, review_id, value) FROM STDIN CSV HEADER';

    const ratingsCommand = 'INSERT INTO ratings (product_id) SELECT Distinct(product_id) FROM reviews; UPDATE ratings SET recommended = rev.t, not_recommended = rev.f, one = rev.one, two = rev.two, three = rev.three, four = rev.four, five = rev.five FROM (SELECT product_id, SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one, SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two, SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three, SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four, SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five, SUM(CASE WHEN recommend=true THEN 1 ELSE 0 END) as t, SUM(CASE WHEN recommend=false THEN 1 ELSE 0 END) as f FROM reviews GROUP BY product_id) as rev WHERE ratings.product_id = rev.product_id;';

    const characteristicsBuildCommand = 'UPDATE characteristics SET total_votes = revs.votes, average = revs.average FROM (SELECT characteristic_id, COUNT(*) as votes, AVG(value) as average FROM characteristics_reviews GROUP BY characteristic_id) AS revs WHERE revs.characteristic_id = characteristics.id;'

    const convertReviewDatetoISOCommand = 'SELECT TO_TIMESTAMP(date/1000) FROM reviews'

    const reviewsCbConvertData = () => {
      pool.connect()
      .then((client) => {
        client.query(convertReviewDatetoISOCommand)
        .then(() => console.log('Finished converting review dates to ISO strings'))
      })
    }

    const reviewCbRatings = () => {
      pool.connect()
      .then(client => {
        client.query(ratingsCommand)
        .then(() => console.log('Finished building meta-ratings table'));
      });
    }

    const characteristicsCbCharacteristicsBuild = () => {
      pool.connect()
      .then(client => {
        client.query(characteristicsBuildCommand)
        .then(() => console.log('Finished bulding meta-characteristics table'))
      });
    }


    const characteristicsCbCharacteristicsReviews = () => {
      upload(pool, characteristicsReviewsCommand, 'characteristic_reviews', characteristicsCbCharacteristicsBuild)
    }

    const reviewCbCharacteristics = () => {upload(pool, characteristicsCommand, 'characteristics', characteristicsCbCharacteristicsReviews)}; // upload characteristics file to db, then upload the characteristics_reviews which references the reviews and characteristics id

    const reviewCbPhotos = () => {upload(pool, photosCommand, 'reviews_photos')}; // upload the photos after you have the reviews uploaded since it references review id

    upload(pool, reviewsCommand, 'reviews', reviewCbPhotos, reviewCbCharacteristics, reviewCbRatings); // upload reviews file to db, then we can read and build the photos and characteristics csv files, as well as building the meta-table for ratings from the review data


  } catch(err) {
      console.log(err);
      throw new Error(err);
  }
}

// UPDATE characteristics SET total_votes = revs.votes, average = revs.average FROM (SELECT characteristic_id, COUNT(*) as votes, AVG(value) as average FROM characteristics_reviews GROUP BY characteristic_id) AS revs WHERE revs.characteristic_id = characteristics.id;

// 'INSERT INTO ratings (product_id) SELECT DISTINCT product_id FROM reviews; UPDATE ratings rat SET one = rev.sum FROM (select product_id, rating, COUNT(rating) as sum FROM reviews WHERE rating = 1 GROUP BY product_id, rating) AS rev WHERE rat.product_id = rev.product_id; UPDATE ratings rat SET two = rev.sum FROM (select product_id, rating, COUNT(rating) as sum FROM reviews WHERE rating = 2 GROUP BY product_id, rating) AS rev WHERE rat.product_id = rev.product_id; UPDATE ratings SET three = rev.sum FROM (select product_id, rating, COUNT(rating) as sum FROM reviews WHERE rating = 3 GROUP BY product_id, rating) AS rev WHERE ratings.product_id = rev.product_id; UPDATE ratings SET four = rev.sum FROM (select product_id, rating, COUNT(rating) as sum FROM reviews WHERE rating = 4 GROUP BY product_id, rating) AS rev WHERE ratings.product_id = rev.product_id; UPDATE ratings SET five = rev.sum FROM (select product_id, rating, COUNT(rating) as sum FROM reviews WHERE rating = 5 GROUP BY product_id, rating) AS rev WHERE ratings.product_id = rev.product_id; UPDATE ratings SET recommended = rev.t, not_recommended = rev.f FROM (SELECT product_id, SUM(CASE WHEN recommend=true THEN 1 ELSE 0 END) as t, SUM(CASE WHEN recommend=false THEN 1 ELSE 0 END) as f FROM reviews GROUP BY product_id) as rev WHERE ratings.product_id = rev.product_id;'



exports.pool = pool;
exports.prepareDB = prepareDB;
