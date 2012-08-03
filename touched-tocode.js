// Convert a jQuery object into a code object that knows its arguments and its type
function toCode(node, commands) {
	// search child nodes
	var findArgs = function(node, args) {
		for(var i = 0; i < node.childNodes.length; ++i) {
			var child = node.childNodes[i];
			if(child.nodeType == 1 && !child.classList.contains('float')) {
				if(child.classList.contains('arg')) {
					var name = child.getAttribute('data-name');
					var param = child.firstChild;
					while(param && param.nodeType != 1)
					param = param.nextSibling;
					args[name] = args[name] || [];
					args[name].push(toCode(param || child, commands));
				} else {
					findArgs(child, args);
				}
			}
		}
		return args;
	};
	// precompute code object attributes
	var argMap = findArgs(node, {});
	var isText = node.classList.contains('box-text');
	var isValid = !node.classList.contains('error') && !node.classList.contains('float') && !node.classList.contains('arg');

	// build code object
	return {
		argMap : argMap,
		id : node.getAttribute('id'),
		type : node.getAttribute('data-type') || '',
		isText : isText,
		text : isText ? node.textContent : undefined,
		isValid : isValid,
		args : function(name, force) {
			return (argMap[name] || []).filter(function(code) {
				return code.isValid;
			});
		},
		arg : function(name) {
			if(argMap[name] === undefined)
				throw "Invalid arg : " + this.type + " -> " + name;
			if(!argMap[name][0].isValid)
				argMap[name][0].error("Missing argument");
			return this.argMap[name][0];
		},
		call : function(data, callback) {
		    if (isValid && commands) {
			var f= commands;
			var type= this.type
			type.split('.').forEach(function(sec) { 
			    f=f && f[sec];
			});
			if (!f) {
			    this.error("Command is not defined: "+type);
			    callback(data);
			}
			return f(this, data, callback);
		    } else {
			callback && callback(data);
		    }
		},
		fold : function(arg, data, callback) {
			var list = this.args(arg);
			var i = 0;
			var f = function(data2) {
				if(i < list.length)
					list[i++].call(data2, f);
				else
					callback(data2);
			};
			f(data);
		},
		error : function(message) {
			markError(this.id, message);
		},
		toString : function() {
			var result = '';
			var keys = getKeys(this.argMap);
			var myargs = this.argMap;
			var count = 0;
			keys.forEach(function(key) {
				myargs[key].forEach(function(element) {
					if(element.isValid) {
						if(!element.text) {
							result = result + key + count + ":" + '{' + "type:" + "\"" + element.type + "\"" + "," + '}' + ",";
							count++;
						} else {
							result = result + key + count + ":" + '{' + "type:" + "\"" + element.type + "\"" + "," + "text:" + "\"" + element.text + "\"" + "," + '}' + ",";
							count++;
						}
						if(element.toString())
							result = result + "args" + count + ":" + element.toString() + ',';
					}
				});
			});
			if(result) {
				return '{' + result + '}';
			}
		}
	};
}

function getKeys(obj) {
	var keys = [];
	for(var key in obj) {
		keys.push(key);
	}
	return keys;
};
