// Convert a jQuery object into a code object that knows its arguments and its type
function toCode(node, commands) {
    var list= $([]);
    var next= node.children();
    while (next.length>0) {
        list= list.add(next.filter('.arg'));
        next= next.filter(':not(.arg)').children();
    }
    return {
        args: function(name, force) { 
            var arglist= list.filter( function() {
                return !name || $(this).attr('data-name')==name;
            })
	    arglist.each( function(i,obj) {
	        if(force && $(obj).children().length==0) {
		    try {
			markError($(obj).attr('id'), "Missing argument");
		    } catch(e) {
			throw "Missing argument: "+name;
		    }
		}
	    });
	    return arglist.children().filter(':not(.error)')
		.map( function(i,obj) { return toCode($(obj), commands); });
        },
        arg: function(name) { return this.args(name, true)[0] || toCode($([])) },
        node: node,
        type: node.attr('data-type'),
        text: node.is('.box-text') ? node.text() : undefined,
	call: function(data) {
	    if (commands) {
		var f= commands;
		this.type.split('.').forEach(function(sec) { 
			f=f[sec]; 
		    });
		if (f)
		    return f(this, data);
		else
		    throw "Undefined function: "+this.type;
	    }
        },
	assert: function(test, message) {
	    if (!test) this.error(message);
	},
	error: function(message) {
	    markError(this.node.attr('id'), message);
	}
    };
}
