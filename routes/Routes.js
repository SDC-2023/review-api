const express = require('express');
const reviewRouter = express.Router();
const {
  getReviews,
  postReviews,
  getReviewsMeta,
  putHelpful,
  putReport,
} = require('../controllers/Controllers.js');


reviewRouter.put('/reviews/:review_id/helpful', putHelpful);
reviewRouter.put('/reviews/:review_id/report', putReport);
reviewRouter.get('/reviews/meta', getReviewsMeta);
reviewRouter.get('/reviews', getReviews);
reviewRouter.post('/reviews', postReviews);

module.exports = reviewRouter;