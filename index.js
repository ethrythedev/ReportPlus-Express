const yaml = require('js-yaml');
const express = require('express');
const fs = require('fs');

const app = express();

const webconfig = yaml.load(fs.readFileSync("config/web.yml"))
const serverconfig = yaml.load(fs.readFileSync("config/server.yml"))

const port = webconfig["port"];

// Define a simple route
app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

// Start the server
app.listen(port, () => {
  console.log(`Report+ Web Server is running on http://localhost:${port}`);
  console.log(`Add whitelisted IPs in web.yml.`);
});
