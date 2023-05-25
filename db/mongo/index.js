const mongoose = require("mongoose");
const { Schema } = mongoose;

mongoose.connect('mongodb://localhost/glossary', { useNewUrlParser: true, useUnifiedTopology: true })

const photos = new Schema({
  id: Number,
  url: String
})

const reviews = new Schema({
  id: {type: Number, unique: true},
  rating: Number,
  summary: String,
  body: String,
  name: String,
  email: String,
  recommend: Boolean,
  helpful: Number,
  report: {type: Boolean, "default": false},
  helpfulness: Number
  photos: {type: Array, "default": mongoose.model('photo', photos)},
  product_id: Number
})

const ratings = new Schema({
  1: Number,
  2: Number,
  3: Number,
  4: Number,
  5: Number,
  recomended: Number,
  not_recommended: Number,
  product_id: Number
})

const characteristics = new Schema({
  id: {type: Number, unique: true},
  name: String,
  total_votes: {type: Number, "default": 0},
  average: {type: Number, "default": 0},
  product_id: Number
})

const characteristics_reviews = newSchema({
  id: {type: Number, unique: true},
  characteristic_id: Number,
  review_id: Number,
  value: Number
})