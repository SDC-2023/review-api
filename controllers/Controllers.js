const { pool } = require('../db/sql/index.js');

module.exports.getReviews = (req, res) => {
  console.log(req.headers)
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
        client.release();
        if (!data.rows.length) {
          res.status(400).send('No product with requested product id!');
        } else {
          res.status(200).send({product: product_id, page: page, count: count, results: data.rows});
        }
      })
    })
  } catch (err) {
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
        client.release();
        if (!data.rows.length) {
          res.status(400).send('No product with requested product id!');
        } else {
          res.status(200).send(data.rows[0]);
        }
      })
    })
  } catch (err) {
    res.status(400).send('Oops');
  }
}

module.exports.postReviews = async(req, res) => {
  const { product_id, rating, summary, body, recommend, name, email, photos, characteristics } = req.body;
  if (!product_id || !rating || !summary || !body || !recommend || !name || !email || !photos || !characteristics) {
    throw new Error ('Did not supply all query parameters')
  }

  let ratingsColumn;
  switch (rating) {
    case 1:
      ratingsColumn = "one";
      break;
    case 2:
      ratingsColumn = "two";
      break;
    case 3:
      ratingsColumn = "three";
      break;
    case 4:
      ratingsColumn = "four";
      break;
    case 5:
      ratingsColumn = "five";
      break;
  }

  let recommended;
  if (recommend) {
    recommended = "recommended";
  } else {
    recommended = "not_recommended";
  }

  try {
    pool.connect()
    .then((client) => {
      return client.query(`INSERT INTO reviews (product_id, rating, summary, body, recommend, reviewer_name, reviewer_email) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`, [product_id, rating, summary, body, recommend, name, email])
      .then(async(data) => {
        let review_id = data.rows[0].id;

        // add to reviews_photos with review_id foreign key
        const a = () => photos.map((photo) =>
          pool.connect((err, client, release) =>
            client.query(`INSERT INTO reviews_photos (review_id, url) VALUES($1, $2)`, [review_id, photo], (err) => {
              if (err) {
                throw new Error ('Could not upload reviews_photos')
              }
              // console.log(`updated reviews_photos ${photo}`)
              release();
              }
            )
          )
        );

        // add to characteristics_reviews with review_id foreign key
        const b = () => Object.keys(characteristics).map((characteristic_id) =>
          pool.connect((err, client, release) =>
            client.query(`INSERT INTO characteristics_reviews (characteristic_id, review_id, value) VALUES($1, $2, $3)`, [characteristic_id, review_id, characteristics[characteristic_id]], (err) => {
              if (err) {
                throw new Error ('Could not update all characteristics')
              }
              // console.log(`updated characteristics ${characteristic_id}`)
              release();
              })
          )
        )

        // update the ratings (meta) table & characteristics table's average (meta average)
        const c = () =>
          pool.connect()
          .then((client) =>
            client.query(`UPDATE ratings SET "${ratingsColumn}" = ${ratingsColumn} + 1, ${recommended} = ${recommended} + 1 WHERE product_id = $1`, [product_id], (err) => {
              if (err) {
                throw new Error ('Could not update all ratings')
              }
              // console.log(`updated ratings for product_id ${product_id} with rating added to ${ratingsColumn} and recommended as ${recommended}`)
              client.release();
              })
        )

        const d = async() => Object.keys(characteristics).map((characteristic_id) =>
          pool.connect((err, client, release) =>
            client.query(`UPDATE characteristics SET average = (average * total_votes + $1) / (total_votes + 1), total_votes = total_votes + 1 WHERE id = $2`, [characteristics[characteristic_id], characteristic_id], (err) => {
              if (err) {
                throw new Error ('Could not update all characteristics')
              }
              // console.log(`updated characteristic_id ${characteristic_id}`)
              release();
              }
            )
          )
        )

        Promise.all([a(), b(), c(), d()])
        .then(() => res.status(201).send('success'))
        .catch(err => res.status(400).send('Could not post review'))
     })
   })
  } catch (err) {
    res.status(400).send('Could not post review')
  }
}

module.exports.putHelpful = (req, res) => {
  try {
    const { review_id } = req.params;

    if (!review_id) {
      throw new Error('Be sure you submit the review_id');
    }

    pool.connect()
    .then((client) => {
      client.query('UPDATE reviews SET helpfulness = helpfulness + 1 WHERE id = $1', [review_id])
      .then(() => {
        client.release();
        res.status(201).send('success');
      })
    })
  } catch (err) {
    res.status(400).send('Failed to mark review as helpful')
  }
}

module.exports.putReport = (req, res) => {
  try {
    const { review_id } = req.params;

    if (!review_id) {
      throw new Error('Be sure you submit the review_id');
    }

    pool.connect()
    .then((client) => {
      client.query('UPDATE reviews SET reported = true WHERE id = $1', [review_id])
      .then(() => {
        client.release();
        res.status(201).send('success');
      })
    })

  } catch (err) {
    res.status(400).send('Failed to report review')
  }
}
