var http = require('http');
var fs = require('fs');

var editmap= {};
http.createServer(function (req, res) {
    if (req.url.match('^/edit-')) {
        var filename= req.url.match('^/edit-([^?]*)')[1];
	var id= Math.random().toString().replace(/^0\./,'');
	editmap[id]=filename;
        fs.readFile('index-static.html', function(err, data) {
            fs.readFile(filename, function(err, data2) {
		res.writeHead(200, {'Content-Type': 'text/html'});
		data= data.toString().replace(/<touched:content>/, data2 || '');
		data= data.toString().replace(/<touched:id>/, id);
		res.end(data);
	    });
        });
    } else if (req.url.match('^/save-')) {
        var id= req.url.match('^/save-([^?]*)')[1];
	var filename= editmap[id] || 'lostdata'+id+'.touched';
        var body = '';
        if (req.method == 'POST') {
            req.on('data', function (data) {
                body += data;
            });
            req.on('end', function () {
		fs.writeFile(filename, body, function(err) {
		    if (err) console.log(body);
		});
            });
        }
    } else {
        var filename= req.url.match('/([^?]*)')[1];
        fs.readFile(filename, function(err, data) {
	    var mime= 'text/html';
	    if (filename.match(/.js/)) mime='text/javascript';
	    if (filename.match(/.css/)) mime='text/css';
            res.writeHead(200, {'Content-Type': mime});
            res.end(data || '<h1>File does not exist.</h1>');
        });
    }
}).listen(process.env.PORT || 7006);
