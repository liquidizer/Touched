commands.help = {
    page : function(code, output, callback) {
	samples=output;
	executeFile('/help.xml', output, function() {
	    code.fold('content', output.select('#help'), function() {});
	});
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
	code.fold('item', output, callback);
    },
    item : {
	element : function(code, output, callback) {
	    output.append('h1').text(code.arg('name').text);
	    var elt= output.append('div').attr('class', 'box element sample');
	    code.args('content').forEach( function(cmd) {
		if (cmd.isText)
		    elt.append('div')
		    .attr('class', 'box-text').text(cmd.text);
		else
		    cmd.call(elt, callback);
	    });
	    callback(output);
	},
	menu : function(code, output, callback) {
	    code.fold('item',output,callback);
	}
    },
    'item-content' : {
	keyword : function(code, output, callback) {
	    output.append('div')
		.attr('class', 'box-text keyword')
	        .text(code.arg('keyword').text);
	},
	arg : function(code, output, callback) {
	    output.append('div')
		.attr('class','box arg')
		.text(code.arg('name').text);
	},
	block : function(code, output, callback) {
	    code.arg('content').call(
		output.append('div').attr('class','box-body'));
	}
    }
}