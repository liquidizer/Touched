var http = require('http');
var fs = require('fs');

// Check port number
var port = process.env.PORT || parseInt(process.argv[2]);
if (!port) {
    console.log('ERROR: no port number provided.');
    console.log('Please run as: node static.js <port>');
    return;
}

// mime types
var mimes= {
    html: 'text/html',
    js: 'text/javascript',
    css: 'text/css',
    jpg: 'image/jpeg',
    png: 'image/png',
    ico: 'image/ico'
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

    // check code if provided
    var filename = req.url.match('^/+([^?]*)')[1];
    var validCode= false;
    if (req.url.match(/[?&]code=/)) {
	var reqCode= (req.url.match('[?&]code=([^&]*)') || [])[1];
	validCode= (reqCode==code) && files[filename];
    }

    // serve appropriate file
    if (req.url.match('^/(index.html)?$')) {
	serveFile(res, 'app/index.html');
    }
    else if (req.url.match(/[?&]mode=(edit|save)/)) {
	// check security code for edit and save actions
	var mode= req.url.match(/[?&]mode=([^&]*)/)[1];

	if (mode=='save') {
	    if (validCode)
		saveFile(req, res, filename);
	    else
		denyAccess(res, 'Invalid security code '+code);
	}
	else {
	    if (waiting) waiting(false);
	    console.log('Grant access to file : '+filename+' [y/n]?');	 
	    waiting= function(granted) {
		if (granted) {
		    files[filename]=true;
		    res.writeHead(303, { 'Location': '/'+filename+'?code='+code });
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
	serveFile(res, filename, validCode);
    }
}).listen(port);

function serveFile(res, filename, validCode) {
    var mime= mimes[filename.replace(/[^.]*\./g,'')];
    fs.readFile(filename, function(err, data) {
	if (!mime) {
	    showTouched(res, filename, data, validCode);
	} 
	else if (data) {
	    res.writeHead(200, { 'Content-Type': mime || 'text/plain'});
	    res.end(data)
	} else {
	    res.writeHead(404, { 'Content-Type': 'text/plain' });
	    res.end('File does not exist.');
	}
    });
}

function showTouched(res, filename, content, editable) {
    var g = 'grammar/' + filename.match('[^.]*$')[0] + '.g';
    fs.stat(g, function(err) {
        if (err) {
            res.writeHead(406, { 'Content-Type': 'text/plain' });
            res.end('The grammar indicated by the file suffix does not exist: ' + g);
        }
        else {
            fs.readFile('app/touched.html', function(err, data) {
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });
		content= content.toString().replace(/^<touched[^>]*>|<\/touched>$/g,'');
                data = data.toString().replace(/<touched:content>/, encodeURI(content));
                data = data.toString().replace(/<touched:file>/, filename);
                data = data.toString().replace(/<touched:code>/, editable ? code : '');
                data = data.toString().replace(/<touched:g>/, '/' + g);
                res.end(data);
            });
        }
    });
}

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
	    if (red.statusCode >= 300 && red.statusCode<310 && red.headers.location) {
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

function saveFile(req, res, filename) {
    console.log('saving: ' + filename);
    var body = '<touched>';
    if (req.method == 'POST') {
        req.on('data', function(data) {
            body += data;
        });
        req.on('end', function() {
	    body += '</touched>';
            fs.writeFile(filename, body, function(err) {
    	        res.writeHead(err ? 406 : 200);
		res.end();
            });
        });
    }
}
