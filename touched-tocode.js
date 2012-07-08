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
	    // find attributes with the name
            var arglist= list;
	    if (name)
		arglist= arglist.filter( function() {
			return $(this).attr('data-name')==name;
		    });
	    // mark errors if the force flag is provided
	    if (force) {
		arglist.each( function(i,obj) {
		    if($(obj).children().length==0) {
			try {
			    markError($(obj).attr('id'), "Missing argument");
			} catch(e) {
			    throw "Missing argument: "+name;
			}
		    }
		});
		if (arglist.length==0)
		    throw "Invalid arg : "+this.type+" -> "+name;
	    }
	    // return child elements
	    return arglist.children().filter(':not(.error)')
		.map( function(i,obj) { return toCode($(obj), commands); });
        },
        arg: function(name) { return this.args(name, true)[0] || toCode($([])) },
        node: node,
        type: node.attr('data-type'),
        text: node.is('.box-text') ? node.text() : undefined,
	call: function(data, callback) {
	    if (commands) {
		var f= commands;
		var type= this.type
		type.split('.').forEach(function(sec) { 
		    f=f && f[sec];
		});
		if (!f) {
		    this.error("Command is not defined: "+type);
		    throw "Undefined function: "+type;
		}
		return f(this, data, callback);
	    }
        },
	fold : function(arg, data, callback) {
	    var list= this.args(arg).toArray();
	    var f= function(data2) {
		if (list.length)
		    list.shift().call(data2, f);
		else
		    callback(data2);
	    };
	    f(data);
	},
	error: function(message) {
	    markError(this.node.attr('id'), message);
	}
    };
}
