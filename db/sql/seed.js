// const fs = require('fs');
// const path = require('path');
// const csv = require('csv-parser');
// const { client } = require('./index.js')

// // read the reviews csv, take the product_ids into a separate array and add them all to products table, then add all reviews to the reviews table

// const ids = [];
// fs.createReadStream(path.join(__dirname, `../../../../Downloads/reviews.csv`))
// .pipe(csv())
// .on('data', (data) => {
//   // console.log(data.id)
//   ids.push([data.id])
// })
// .on('end', () => {
//   ids.forEach((id) => {
//     client.query('INSERT INTO products (id) VALUES($1)',[id])
//   })
//   // client.query('SELECT * FROM products')
//   // .then((res) => console.log(res.rows))
//   // console.log('donezo')
// });

// const parsecsv = (filename, resultsArr) => {
//     fs.createReadStream(path.join(__dirname, `../../../../Downloads/${filename}.csv`))
//     .pipe(csv())
//     .on('data', (data) => resultsArr.push(data))
//     .on('end', () => {
//       console.log(resultsArr);
//       console.log(`successfully parsed ${filename} data`)
//   });
// }
// const characteristicsData = [];
// parsecsv('characteristics', characteristicsData);
