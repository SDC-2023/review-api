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
  http.get('http://localhost:3000/api/reviews/431/helpful',);
  sleep(1);
}
