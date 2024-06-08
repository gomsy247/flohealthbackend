import puppeteer from 'puppeteer';
import fs from 'fs';
import mysql from 'mysql';

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://www.alibaba.com');

  // Wait for the product container to load
  await page.waitForSelector('.product-container');

  // Extract product details
  const productDetails = await page.evaluate(() => {
    const products = document.querySelectorAll('.product-container');
    const details = [];

    products.forEach((product) => {
      const name = product.querySelector('.product-name').innerText;
      const price = product.querySelector('.product-price').innerText;
      const imageUrl = product.querySelector('.product-image').src;

      details.push({ name, price, imageUrl });
    });

    return details;
  });

  // Store results in JSON file
  fs.writeFileSync('./result.json', JSON.stringify(productDetails, null, 2));

  // Store product details in MySQL database
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'puppeteer',
  });

  connection.connect();

  productDetails.forEach((product) => {
    const query = 'INSERT INTO products (name, price, imageUrl) VALUES (?, ?, ?)';
    connection.query(query, [product.name, product.price, product.imageUrl], (error, results) => {
      if (error) throw error;
      console.log('Product inserted:', results);
    });
  });

  connection.end();

  await browser.close();
})();
