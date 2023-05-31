import http from 'k6/http';
import { sleep } from 'k6';
export const options = {
  stages: [
    { duration: '5s', target: 1000 },
    { duration: '30s', target: 1000}
  ],
};

export default function () {
    // testing roughly last 10% of database, with a size of 1,000,000
    let product_id = Math.floor(Math.random() * 100000 + 900000);
  http.get('http://localhost:3000/api/reviews',{headers: {"product_id": product_id, sort: "helpful"}});
  sleep(1);
}
