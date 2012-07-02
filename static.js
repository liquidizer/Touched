var http = require('http');
var fs = require('fs');

http.createServer(function (req, res) {
    console.log(req.url);
    if (req.url.match('/save/')) {
        console.log('saving content');
        var body = '';
        if (req.method == 'POST') {
            req.on('data', function (data) {
                body += data;
            });
            req.on('end', function () {
                console.log(body);
            });
        }
    } else {
        var filename= req.url.match('/([^?]*)')[1];
        console.log(filename);
        fs.readFile(filename, function(err, data) {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(data);
        });
    }
}).listen(process.env.PORT || 9615);
