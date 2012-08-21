var commands={};
var codestring = "";
function execute(codeId, outputId) {
    var code = toCode(document.getElementById(codeId), commands);
    var output = d3.select(outputId ? '#'+outputId : document.documentElement);
    var mustRecalc= code.toString() != codestring;
    if(mustRecalc) {
	setTimeout(function() {
			output.selectAll('*').remove();
			//VizData.json(eval('(' + code.toString() + ')')).toDOM(output.append('div'));
			code.args('start').forEach(function(cmd) {
				cmd.call(output);
			});
			codestring = code.toString();
	}, 250);
    }
    return mustRecalc;
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

function getNum(code, output, callback) {
	if (code.type == 'number')
		callback(parseFloat(code.text));
	else
		setTimeout(function() { code.call(output, callback); }, 10);
}

function foldLR(code, output, callback){
	getNum(code.arg('left'), output, function (result1) {
		getNum(code.arg('right'),output, function(result2) {	
			//output.append('p').text('res= ' + result1+","+result2);
			callback(result1, result2);				    
		});				
	 });
}

commands.mathui = {
		calculate : function(code, output){
		code.arg('formula').call(output, function (result) {
			output.append('p').text(result);
		});
	}
}

commands.math = {
	number : {
		plus : function(code, output, callback) {
			foldLR(code, output, function(a,b) { callback(a+b); });
		},
		times : function(code, output, callback) {
	        foldLR(code, output, function(a,b) { callback(a*b); });
		},
		minus : function(code, output, callback) {
            foldLR(code, output, function(a,b) { callback(a-b); });
		},
		divide : function(code, output, callback) {
            foldLR(code, output, function(a,b) { callback(a/b); });
		},
		min : function(code, output, callback){
            foldLR(code, output, function(a,b) { callback(Math.min(a,b)); });
		},
	    max : function(code, output, callback){
	    	foldLR(code, output, function(a,b) { callback(Math.max(a,b)); });
		},
		abs : function (code, output, callback){
	        getNum(code.arg('argument'), output, function(result){
	        	callback(Math.abs(result));
	        });
		},
		exp : function(code, output, callback){
	        getNum(code.arg('argument'), output, function(result){
	        	callback(Math.exp(result));
	        });
		},
		log : function(code, output, callback){
	        getNum(code.arg('argument'), output, function(result){
	        	callback(Math.log(result));
	        });
		},
		sqrt : function(code, output, callback){
	        getNum(code.arg('argument'), output, function(result){
	        	callback(Math.sqrt(result));
	        });
		},
		pow : function(code, output, callback){
	        getNum(code.arg('basis'), output, function(result1){
	        	getNum(code.arg('exponent'), output, function(result2){              
	                callback(Math.pow(result1, result2));	        	
	        });
	        });
		},
		sin : function(code, output, callback){
	        getNum(code.arg('argument'), output, function(result){	        	
	        	callback(Math.sin(result));
	        });
		},
		cos : function(code, output, callback){
	        getNum(code.arg('argument'), output, function(result){	        	
	        	callback(Math.cos(result));
	        });
		}
	},
	bool : {
		gt : function(code, output, callback){
			foldLR(code, output, function(a,b) { callback(a > b); });
		},
		lt : function(code, output, callback){
			foldLR(code, output, function(a,b) { callback(a < b); });
		},
		eq : function(code, output, callback){
			foldLR(code, output, function(a,b) { callback(a == b); });
		},
		neq : function(code, output, callback){
			foldLR(code, output, function(a,b) { callback(a != b); });
		},
	}
}
