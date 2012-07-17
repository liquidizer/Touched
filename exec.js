var commands={};
function execute(codeId, outputId) {
    var code= toCode(document.getElementById(codeId), commands);
    var output=d3.select('#'+outputId);
    code.args('start').forEach(function(cmd) { cmd.call(output); });
}

// implement the xml grammar
commands.xml= {
    doc : function(code, output) {
	output.selectAll('*').remove();
	code.arg('root-node').call(output);
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

