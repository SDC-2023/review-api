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
  let data = {"product_id": 2342,"rating": 5,"summary":"myspeasdfadsfasdfsdfasfedcialsummasfdsadary","body":"mfasdfyspecasdfasdfaialbodyasdfasdf","recommend":true,"name":"my name","email":"not my email","photos":["url1","urldsdsdaff2","utrfgrl3"],"characteristics":{"1":1,"2":3,"3":4,"4":1}};
  let res = http.post(`http://localhost:3000/api/reviews/`, JSON.stringify(data), {headers: {'Content-Type': 'application/json'}});
  sleep(1);
}


// randomize product id