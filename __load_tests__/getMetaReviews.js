import http from 'k6/http';
import { sleep, check } from 'k6';
export const options = {
  stages: [
    { duration: '5s', target: 1 },
    { duration: '5s', target: 10 },
    { duration: '5s', target: 100 },
    { duration: '5s', target: 1000 },
  ],
};

export default function () {
  let product_id = Math.floor(Math.random() * 1000000 + 1);
  let res = http.get('http://localhost:3000/api/reviews/meta',{headers: {"product_id": product_id, sort: "helpful"}});
  check(res, 'confirms 200 response code', (res) => res.status === 200)
  sleep(1);
}
