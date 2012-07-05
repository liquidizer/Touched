var commands={};
function execute() {
    clearErrors();
    var output=d3.select('#dataview');
    var code= toCode($('#canvas'), commands);
    code.arg('start').call(output);
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
		code.args('child').each( function(i, child) {
			if (child.text)
			    output.text(child.text);
			else
			    child.call(output);
		    });
	    }
	},
	attr : function(code, output) {
	    output.attr(code.arg('attrib').text, code.arg('value').text);
	}
    }
}

