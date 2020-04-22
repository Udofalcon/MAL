const fs = require('fs');
const cache = new (require('node-cache'))({ stdTTL: 60 * 60 * 12 });
const server = require('http').createServer(function (req, res) {
    var body = '';

    switch(req.url) {
        case '/':
            fs.readFile('./src/index.html', function (err, data) {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.write(data);
                res.end();
            });
            break;
        case '/index.js':
            fs.readFile('./src/' + req.url, function (err, data) {
                res.writeHead(200, { 'Content-Type': 'text/javascript' });
                res.write(data);
                res.end();
            });
            break;
        case '/favicon.ico':
            fs.readFile('./src/' + req.url, function (err, data) {
                res.writeHead(200, { 'Content-Type': 'image/x-icon' });
                res.write(data);
                res.end();
            });
            break;
        case '/jikan':
            delete require.cache[require.resolve('./jikan')];
            req.on('data', function(data) {
                body += data;
            });
            req.on('end', function () {
                var data = JSON.parse(body);
                
                require('./jikan')(data, res, cache);
            });
            break;
    }
});

server.listen(3000);
