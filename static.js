var http = require('http');
var fs = require('fs');

http.createServer(function(req, res) {
    console.log('request: ' + req.url);
    if (req.url.match('^/(index.html)?')) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Please connect to this page with http:/edit/<Your File>.<Your Grammar>');
    }
    else if (req.url.match('^/edit/')) {
        var filename = req.url.match('^/edit/([^?]*)')[1];
        var g = 'grammar/' + filename.match('[^.]*$')[0] + '.g';
        console.log('editing ' + filename + ' with grammar ' + g);

        fs.stat(g, function(err) {
            if (err) {
                res.writeHead(406, { 'Content-Type': 'text/plain' });
                res.end('The grammar indicated by the file suffix does not exist: '+g);
            } else {
                fs.readFile('index-static.html', function(err, data) {
                    fs.readFile(filename, function(err, data2) {
                        res.writeHead(200, {
                            'Content-Type': 'text/html'
                        });
                        data = data.toString().replace(/<touched:content>/, data2 || '');
                        data = data.toString().replace(/<touched:file>/, filename);
                        data = data.toString().replace(/<touched:g>/, '/' + g);
                        res.end(data);
                    });
                });
            }
        });
    }
    else if (req.url.match('^/save/')) {
        var filename = req.url.match('^/save/([^?]*)')[1];
        console.log('saving: ' + filename);
        var body = '';
        if (req.method == 'POST') {
            req.on('data', function(data) {
                body += data;
            });
            req.on('end', function() {
                res.end();
                fs.writeFile(filename, body, function(err) {
                    if (err) console.log(body);
                });
            });
        }
    }
    else {
        var filename = req.url.match('/([^?]*)')[1];
        fs.readFile(filename, function(err, data) {
            var mime = 'text/html';
            if (filename.match(/.js/)) mime = 'text/javascript';
            if (filename.match(/.css/)) mime = 'text/css';
            res.writeHead(200, {
                'Content-Type': mime
            });
            res.end(data || '<h1>File does not exist.</h1>');
        });
    }
}).listen(process.env.PORT || 7006);