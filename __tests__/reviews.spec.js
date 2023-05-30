const express = require('express');
const request = require('supertest');
const routes = require('../routes/Routes.js');
const { pool } = require('../db/sql/index.js');

// Create server instance
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}))
app.use('/api', routes);

afterAll(() => {
  pool.end();
})

describe('Get & put routes', () => {
  test('Should get meta-review data with product_id', () => {
    return request(app)
    .get('/api/reviews/meta')
    .set({ "product_id": 1})
    .then((res) => {
      expect(res.status).toEqual(200);
      expect(res.body.characteristics.length).toEqual(4);
      expect(res.body.product_id).toEqual(1);
      expect(res.body.characteristics[1].Length.id).toEqual(2);
    })
  })

  test('Should retrieve reviews, put helpful, and update helpful count for review in reviews table', () => {
    // expect.assertions(3);

    let product_id = 4;
    let review_id;
    let helpful;

    return request(app)
    .get(`/api/reviews/`) // get the reviews for this product
    .set({"product_id": product_id, "page": 1, "count": 5, "sort": "helpful"})
    .then((res) => {
      review_id = res.body.results[0].review_id; // collect the review_id
      helpful = res.body.results[0].helpfulness; // and the current helpfulness count
      return request(app)
      .put(`/api/reviews/${review_id}/helpful`) // make a put request to implement helpfulness
      .then((res) => {
        expect(res.status).toEqual(201);
        expect(res.text).toEqual('success'); // expect the put request to be successful
      })
    })
    .then(() => {
      return request(app)
      .get('/api/reviews/')
      .set({"product_id": product_id, "page": 1, "count": 5, "sort": "helpful"})
      .then((res) => {
        let ind = Number(res.body.results.findIndex((item) => item.review_id === review_id)); // be sure to
        expect(res.body.results[ind].helpfulness).toEqual(helpful + 1);
      })
    })
  })

  test('Should reject reviews request when no product id or sort is not supplied', () => {

    return request(app)
    .get('/api/reviews/')
    .set({"sort": "helpful"}) // no product_id input
    .then((res) => {
      expect(res.status).toEqual(400);
    })
    .then(() => {
      return request(app)
      .get('/api/reviews/')
      .set({"product_id": 1}) // no sort input
      .then((res) => {
        expect(res.status).toEqual(400);
      })
    })
  })

  test('Should reject reviews request when invalid product_id is supplied', () => {
    return request(app)
    .get('/api/reviews')
    .set({sort: "helpful", product_id: -12})
    .then((res) => {
      expect(res.status).toEqual(400);;
    })
  })

  test('Should reject reviews/meta request when no product_id is supplied', () => {
    return request(app)
    .get('/api/reviews/meta')
    .then((res) => {
      expect(res.status).toEqual(400);
    })
  })

})

describe("Post requests", () => {

  test("Should post review to database", () => {
    let postData = {"product_id":1,"rating":5,"summary":"myspecialsummary","body":"mysasdpecsdfasdf","recommend":true,"name":"my000000000000000000000 name","email":"not my email","photos":["url1","urldsdsdaff2","utrfgrl3"],"characteristics":{"1":1,"2":3,"3":4,"4":1}}
    return request(app)
    .post('/api/reviews')
    .set('Content-Type', 'application/json')
    .send(postData)
    .then((res) => {
      expect(res.status).toEqual(201);
      expect(res.text).toEqual("success");
    })
  })
})