import http from 'k6/http';
import { sleep } from 'k6';
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
  http.get('http://localhost:3000/api/reviews',{headers: {"product_id": product_id, sort: "helpful"}});
  sleep(1);
}
