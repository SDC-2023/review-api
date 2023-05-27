const { pool } = require('../db/sql/index.js');

module.exports.getReviews = (req, res) => {
  try {
    console.log(req.headers);
    let { page, count, sort, product_id } = req.headers;
    switch (sort) {
      case 'newest':
        sort = "date DESC"; // newest first
      case 'helpful':
        sort = "helpfulness DESC"; // most helpful at the top
      case 'relevant':
    }
    page = page ? page : 1;
    count = count ? count : 5;
    if (!product_id || !sort) {
      throw new Error(`Missing headers. Received product_id: ${product_id}, sort: ${sort}`)
    }
    pool.connect()
    .then((client) => {
      // get all reviews with product_id from reviews table
      // order by sort
      // offset by (page - 1) * count (page 3 * 5 count/page means starting at result 10)
      // limit by count
      client.query('SELECT reviews.id AS review_id, array_agg(array[reviews_photos.id::varchar, reviews_photos.url]) as photos, rating, summary, recommend, response, body, TO_TIMESTAMP(date), reviewer_name, helpfulness FROM reviews FULL OUTER JOIN reviews_photos ON reviews_photos.review_id = reviews.id WHERE reviews.product_id= $1 AND reviews.reported = false GROUP BY reviews.id ORDER BY $2 OFFSET $3 LIMIT $4 ;', [product_id, sort, (page - 1) * count, count])
      .then((data) => {
        res.status(200).send({product: product_id, page: page, count: count, results: [data.rows]});
      })
    })
  } catch (err) {
    console.log(err);
    res.status(400).send('Oop')
  }
}
// SELECT reviews_photos.id, reviews_photos.url, reviews.id AS review_id, rating, summary, recommend, response, body, TO_TIMESTAMP(date), reviewer_name, helpfulness FROM reviews FULL OUTER JOIN reviews_photos ON reviews_photos.review_id = reviews.id WHERE reviews.product_id= 12;

// SELECT id AS review_id, rating, summary, recommend, response, body, TO_TIMESTAMP(date), reviewer_name, helpfulness FROM reviews WHERE product_id = $1 AND reported = false ORDER BY $2 OFFSET $3 LIMIT $4 FULL OUTER JOIN reviews_photos ON reviews_photos.review_id = reviews.id

module.exports.getReviewsMeta = (req, res) => {
  try {

  } catch (err) {
    res.status(400).send('Oops')
  }
}

module.exports.postReviews = (req, res) => {
  try {

  } catch (err) {
    res.status(400).send('Oops')
  }
}

module.exports.putHelpful = (req, res) => {
  try {

  } catch (err) {
    res.status(400).send('Oops')
  }
}

module.exports.putReport = (req, res) => {
  try {

  } catch (err) {
    res.status(400).send('Oops')
  }
}