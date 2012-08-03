var commands={};
var codestring = "";
function execute(codeId, outputId) {
	try {
		setTimeout(function() {
			var code = toCode(document.getElementById(codeId), commands);
			var output= d3.select(outputId ? '#'+outputId : document.documentElement);
			if(code.toString() != codestring) {
				output.selectAll('*').remove();
				//VizData.json(eval('(' + code.toString() + ')')).toDOM(output.append('div'));
				code.args('start').forEach(function(cmd) {
					cmd.call(output);
				});
				codestring = code.toString();
			}
		}, 500);
	} catch(e) {
		output.append('div').text(code.toString());
	}
}

function executeFile(filename, output, callback) {
    d3.text(filename, function(data) {
	code= toCode($(data)[0], commands);
	code.args('start').forEach(function(cmd) { 
	    cmd.call(output, callback); 
	});
    });
}

// implement the xml grammar
commands.xml= {
    doc : function(code, output, callback) {
	output.selectAll('*').remove();
	code.arg('root-node').call(output);
	callback && callback();
    },
    node : {
	elt : function(code, output) {
	    if (code.arg('tag').text) {
		var output= output.append(code.arg('tag').text);
		code.args('child').forEach( function(child) {
			if (child.isText)
			    output.text(child.text);
			else
			    child.call(output);
		    });
	    }
	},
	attr : function(code, output) {
	    if (code.arg('attrib').text && code.arg('value').text)
		output.attr(code.arg('attrib').text, code.arg('value').text);
	}
    }
}

