import http from 'k6/http';
import { sleep, check } from 'k6';
export const options = {
  stages: [
    { duration: '5s', target: 1000 },
    { duration: '30s', target: 1000}
  ],
};

export default function () {
  // testing roughly last 10% of database, with a size of 1,000,000
  let product_id = Math.floor(Math.random() * 100000 + 900000);
  let res = http.get('http://localhost:3000/api/reviews/meta',{headers: {"product_id": product_id, sort: "helpful"}});
  check(res, 'confirms 200 response code', (res) => res.status === 200)

  sleep(1);
}
