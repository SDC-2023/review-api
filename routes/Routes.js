const express = require('express');
const reviewRouter = express.Router();
const {
  getReviews,
  postReviews,
  getReviewsMeta,
  putHelpful,
  putReport,
} = require('../controllers/Controllers.js');

reviewRouter.get('/reviews', getReviews);
reviewRouter.post('/reviews', postReviews);
reviewRouter.get('/reviews/meta', getReviewsMeta);
reviewRouter.put('/reviews/:review_id/helpful', putHelpful);
reviewRouter.put('/reviews/:review_id/report', putReport);

module.exports = reviewRouter;