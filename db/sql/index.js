const { Pool } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { from } = require('pg-copy-streams');
dotenv.config();

// Create new client
const pool = new Pool({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
  port: process.env.port,
});

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

    console.log('Deleting all current tables in database...')
    // drop all current tables
    await client.query('DROP TABLE IF EXISTS products, reviews, photos, reviews_photos, ratings, characteristics_reviews, characteristics;');

    console.log('Reinitializing all tables in database...')
    // tables created are: reviews, reviews_photos, characteristics, characteristics_reviews
    await client.query('CREATE TABLE reviews (id INT PRIMARY KEY, product_id INT, rating INT, date BIGINT, summary VARCHAR(10000), body VARCHAR(10000), recommend BOOL, reported BOOL default FALSE, reviewer_name VARCHAR(100), reviewer_email VARCHAR(100), response VARCHAR(300), helpfulness INT default 1);\
    CREATE TABLE reviews_photos(id INT PRIMARY KEY, review_id INT REFERENCES reviews(id), url VARCHAR(1000));\
    CREATE TABLE characteristics (id INT PRIMARY KEY, product_id INT, name VARCHAR(200), total_votes INT DEFAULT 0, average NUMERIC DEFAULT 0);\
    CREATE TABLE characteristics_reviews(id INT PRIMARY KEY, characteristic_id INT REFERENCES characteristics(id), review_id INT REFERENCES reviews(id), value INT);');

    console.log('Reseeding all tables in database...')
    const reviewsCommand = 'COPY reviews (id, product_id, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness) FROM STDIN CSV HEADER';
    const photosCommand = 'COPY reviews_photos (id, review_id, url) FROM STDIN CSV HEADER';
    const characteristicsCommand = 'COPY characteristics (id, product_id, name) FROM STDIN CSV HEADER';
    const characteristicsReviewsCommand = "COPY characteristics_reviews (id, characteristic_id, review_id, value) FROM STDIN CSV HEADER";

    const characteristicsCbCharacteristicsReviews = () => {
      upload(pool, characteristicsReviewsCommand, 'characteristic_reviews')
    }

    const reviewCbCharacteristics = () => {upload(pool, characteristicsCommand, 'characteristics', characteristicsCbCharacteristicsReviews)}; // upload characteristics file to db, then upload the characteristics_reviews which references the reviews and characteristics id

    const reviewCbPhotos = () => {upload(pool, photosCommand, 'reviews_photos')}; // upload the photos after you have the reviews uploaded since it references review id

    upload(pool, reviewsCommand, 'reviews', reviewCbPhotos, reviewCbCharacteristics); // upload reviews file to db


  } catch(err) {
      console.log(err);
      throw new Error(err);
  }
}


exports.pool = pool;
exports.prepareDB = prepareDB;
