commands.help = {
    page : function(code, output, callback) {
	output.selectAll('*').remove();
	code.fold('content', output, function() {});
    },
    entry : {
	element : function(code, output, callback) {
	    output.append('h2')
		.text('Element '+code.arg('type').text);
	    output.append('hr');
	    code.fold('content', output.append('div'), callback);
	}
    },
    content : {
	key : function(code, output, callback) {
	    output.append('p').text(code.arg('key').text);
	    callback(output);
	},
	section : function(code, output, callback) {
	    output.append('h3').text(code.arg('name').text);
	    code.fold('content', output.append('section'), callback);
	    callback(output);
	},
	arg : function(code, output, callback) {
	    output.append('h3').text('Argument '+code.arg('arg').text);
	    code.fold('content', output.append('section'), callback);
	    callback(output);
	},
	text : function(code, output, callback) {
	    output.append('p').text(code.arg('text').text);
	    callback(output);
	},
	sample : function(code, output, callback) {
	    callback(output);
	}
    }
}

commands.touched = {
    grammar : function(code, output, callback) {
	
    }
}