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
  let review_id = Math.floor(Math.random() * 1000000 + 1);

  http.put(`http://localhost:3000/api/reviews/${review_id}/report`);
  sleep(1);
}
