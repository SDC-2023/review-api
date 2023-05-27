const { pool } = require('../db/sql/index.js');

module.exports.getReviews = (req, res) => {
  try {

    let { page, count, sort, product_id } = req.headers;
    switch (sort) {
      case 'newest':
        sort = "date DESC"; // newest first
        break;
      case 'helpful':
        sort = 'helpfulness DESC'; // most helpful at the top
        break;
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
      client.query(`SELECT reviews.id AS review_id, array_agg(json_build_object('id', reviews_photos.id::varchar, 'url', reviews_photos.url)) as photos, rating, summary, recommend, response, body, TO_TIMESTAMP(date/1000) as date, reviewer_name, helpfulness FROM reviews FULL OUTER JOIN reviews_photos ON reviews_photos.review_id = reviews.id WHERE reviews.product_id= $1 AND reviews.reported = false GROUP BY reviews.id ORDER BY ${sort} OFFSET ${(page - 1) * count} LIMIT ${count};`, [product_id])
      .then((data) => {
        res.status(200).send({product: product_id, page: page, count: count, results: data.rows});
      })
    })
  } catch (err) {
    console.log(err);
    res.status(400).send('Could not retrieve reviews. Ensure you are sending a product_id and a sort');
  }
}


module.exports.getReviewsMeta = (req, res) => {
  try {
    const { product_id } = req.headers;

    if (!product_id) {
      throw new Error('Be sure to send in product_id');
    }

    pool.connect()
    .then((client) => {
      client.query(`SELECT ratings.product_id, json_build_object('1', one, '2', two, '3', three, '4', four, '5', five) AS ratings, json_build_object(0, recommended, 1, not_recommended) AS recommended, json_agg(json_build_object(name, json_build_object('id', id, 'value', average))) AS characteristics FROM ratings FULL JOIN characteristics ON characteristics.product_id = ratings.product_id WHERE ratings.product_id = $1 GROUP BY ratings.product_id`, [product_id])
      .then((data) => {
        res.status(200).send(data.rows)
      })
    })
  } catch (err) {
    console.log(err);
    res.status(400).send('Oops');
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
    console.log(req.params, req.headers, req.query)
    const { review_id } = req.params;

    if (!review_id) {
      throw new Error('Be sure you submit review_id');
    }

    pool.connect()
    .then((client) => {
      client.query('UPDATE reviews SET reported = true WHERE id = $1', [review_id])
      .then((data) => res.status(201).send('success'))
    })

  } catch (err) {
    res.status(400).send('Oops')
  }
}