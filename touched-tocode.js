// Convert a jQuery object into a code object that knows its arguments and its type
function toCode(node, commands) {
    // search child nodes
    var findArgs= function(node, args) {
	for (var i=0; i<node.childNodes.length; ++i) {
	    var child= node.childNodes[i];
	    if (child.nodeType==1) {
		if (child.classList.contains('arg')) {
		    var name= child.getAttribute('data-name');
		    var param= child.firstChild;
		    while (param && (param.nodeType!=1 || param.classList.contains('error'))) 
			param=param.nextSibling;
		    args[name]= args[name] || [];
		    args[name].push(toCode(param || child, {}));
		} else {
		    findArgs(child, args);
		}
	    }
	}
	return args;
    };
    var argMap= findArgs(node, {});
    // build code object
    return {
	argMap : argMap,
        args: function(name, force) {
	    if (argMap[name]===undefined)
		throw "Invalid arg : "+this.type+" -> "+name;
	    if (force && argMap[name].length==0) {
		try {
		    markError(this.id, "Missing argument");
		} catch(e) {
		    throw "Missing argument: "+name;
		}
	    }
	    return argMap[name];
        },
        arg: function(name) { return this.args(name, true)[0] || toCode(null) },
        id: node.getAttribute('id'),
        type: node.getAttribute('data-type') || '',
        text: node.classList.contains('box-text') && node.textContent,
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
	    var i=0;
	    var f= function(data2) {
		if (i < list.length)
		    this.args(arg)[i++].call(data2, f);
		else
		    callback(data2);
	    };
	    f(data);
	},
	error: function(message) {
	    markError(this.id, message);
	}
    };
}
