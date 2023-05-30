const express = require('express');
const request = require('supertest');
const routes = require('../routes/Routes.js');
const { pool } = require('../db/sql/index.js');

// Create server instance
const app = express();
app.use('/api', routes);

afterAll(() => {
  pool.end();
})

describe('Get routes', () => {
  test('Should get meta-review data with product_id', async() => {
    await request(app)
    .get('/api/reviews/meta')
    .set({"page": 1, "count": 5, "sort": "helpful", "product_id": 1})
    .then((res) => {
      expect(res.status).toEqual(200);
      expect(res.body.characteristics.length).toEqual(4);
      expect(res.body.product_id).toEqual(1);
      expect(res.body.characteristics[1].Length.id).toEqual(2);
    })
    // .then(() => pool.end())
  })
})