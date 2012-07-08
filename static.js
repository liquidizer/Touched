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
var code= generateCode(24);
var files={};
var waiting= null;

// Keyboard waits for y/Y input to grand write access
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data',function(text) {
    if (waiting)
	waiting(text.match(/ *y(es)? */i));
});

// Run web server
http.createServer(function(req, res) {
    if (req.url.match('^/(index.html)?$')) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Please connect to this page with http:<url>/edit/<Your_File>.<Your Grammar>');
    }
    else if (req.url.match('^/(edit|save)/')) {
	// check security code for edit and save actions
	var mode= req.url.match('^/(edit|save)/')[1];
	var filename= req.url.match('^/(edit|save)/([^?]*)')[2];
	var reqCode= (req.url.match('[?&]code=([^&]*)') || [])[1];

	if (reqCode && code==reqCode && files[filename]) {
	    grantAccess(req, res, mode, filename);
	}
	else {
	    if (waiting) waiting(false);
	    console.log('Grant access to file : '+filename+' [y/n]?');	 
	    waiting= function(granted) {
		if (granted) {
		    files[filename]=true;
		    res.writeHead(303, { 'Location': '/'+mode+'/'+filename+'?code='+code });
		    res.end();
		} else {
		    denyAccess(res, 'Access denied: '+filename);
		}
		waiting= null;
	    }	   
	}
    }
    else if (req.url.match("/redirect/")) {
	var url= req.url.match("/redirect/(.*)")[1];
	redirect(res, url);
    }
    else {
	var filename = req.url.match('^/([^?]*)')[1];
	fs.readFile(filename, function(err, data) {
            var mime = 'text/html';
	    if (filename.match(/.js/)) mime = 'text/javascript';
	    if (filename.match(/.css/)) mime = 'text/css';
	    if (data) {
		res.writeHead(200, { 'Content-Type': mime });
		res.end(data)
	    } else {
		res.writeHead(404, { 'Content-Type': 'text/plain' });
		res.end('File does not exist.');
	    }
        });
    }
}).listen(port);

function redirect(res, url) {
    var comps= url.match("http://([^/:]+)(:[0-9]+)?(.*)");
    if (comps) {
	var options= {
	    host: comps[1],
	    port: comps[2] || 80,
	    path: comps[3] || '/',
	};
	http.get(options, function(red) {
	    red.setEncoding('utf8');
	    if (red.statusCode >= 300 && red.statusCode<310 && headers.location) {
		// redirecting
 		redirect(res, red.headers.location);
	    } else {
		res.writeHead(red.statusCode);
		red.on('data', function (chunk) {
		    res.write(chunk);
		});
		red.on('end', function() {
		    res.end();
		});
	    }
	});
    } else {
	res.writeHead(400);
	res.end();
    }
}

function denyAccess(res, message) {
    console.log(message);
    res.writeHead(406, { 'Content-Type': 'text/plain' });
    res.end(message);
}

function grantAccess(req, res, mode, filename) {
    if (mode=='edit') {
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
                        data = data.toString().replace(/<touched:code>/, code);
                        data = data.toString().replace(/<touched:g>/, '/' + g);
                        res.end(data);
                    });
                });
            }
        });
    }
    else if (mode=='save') {
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