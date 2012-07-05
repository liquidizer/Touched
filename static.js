var http = require('http');
var fs = require('fs');

// Check port number
var port = process.env.PORT || parseInt(process.argv[2]);
if (!port) {
    console.log('ERROR: no port number provided.');
    console.log('Please run as: node static.js <port>');
    return;
}

// Generate validation code
function generateCode(len) {
    var r = Math.floor(Math.random() * 62);
    return len == 0 ? "" : generateCode(len - 1) + 
	String.fromCharCode(r < 10 ? r + 48 : (r < 36 ? r + 65 - 10 : r + 97 - 36));
}
var code = generateCode(24);

console.log('Edit code = ' + code);
console.log();
console.log('For secure file access all pages must provide a valid code:');
console.log('  http://...?code=<code>');
console.log();

// Run web server
http.createServer(function(req, res) {
    if (req.url.match('^/(index.html)?$')) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Please connect to this page with http:<url>/edit/<Your_File>.<Your Grammar>?code=<code>');
    }
    else if (req.url.match('^/(edit|save)/')) {
	// check security code for edit and save actions
	var m1= req.url.match('^/(edit|save)/([^?]*)[?&]code=([^&]*)')
        var extCode = m1 && m1[3];
        if (extCode != code) {
            console.log('Invalid code provided by user : '+extCode);
            res.writeHead(406, { 'Content-Type': 'text/plain' });
            res.end('Invalid security code');
            return;
        }
	var filename= m1[2];
        if (m1[1]=='edit') {
            var g = 'grammar/' + filename.match('[^.]*$')[0] + '.g';
            console.log('editing ' + filename + ' with grammar ' + g);

            fs.stat(g, function(err) {
                if (err) {
                    res.writeHead(406, { 'Content-Type': 'text/plain' });
                    res.end('The grammar indicated by the file suffix does not exist: ' + g);
                }
                else {
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
        else if (m1[1]=='save') {
            console.log('saving: ' + filename);
            var body = '';
            if (req.method == 'POST') {
                req.on('data', function(data) {
                    body += data;
                });
                req.on('end', function() {
                    fs.writeFile(filename, body, function(err) {
    	                res.writeHead(err ? 406 : 200);
			res.end();
                    });
                });
            }
        } else {
	    res.end();
	}
    }
    else {
	var filename = req.url.match('^/([^?]*)')[1];
	fs.readFile(filename, function(err, data) {
            var mime = 'text/html';
	    if (filename.match(/.js/)) mime = 'text/javascript';
	    if (filename.match(/.css/)) mime = 'text/css';
	    res.writeHead(200, { 'Content-Type': mime });
	    res.end(data || '<h1>File does not exist.</h1>');
        });
    }
}).listen(port);