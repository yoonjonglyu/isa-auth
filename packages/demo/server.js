const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
};

const server = http.createServer((req, res) => {
  const reqUrl = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(__dirname, reqUrl);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'text/plain',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 ISA-AUTH Demo Playground running at http://localhost:${PORT}`);
});
