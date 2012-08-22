progFunctions= {};
progValues= {};

commands.prog = {
    'function' : function(code, output, callback) {
	progFunctions.fun= code;

	output.append('p').text('Function '+code.arg('name').text);
	var argSet= getArguments(code, {});
	var table= output.append('form').append('table');
	console.log(progValues);
	for (key in argSet) {
	    var row= table.append('row');
	    row.append('td').text(key);
	    row.append('td')
		.append('input')
		.attr('class','runvalue')
		.attr('key',key)
		.attr('value',progValues[key] || 100)
		.on('submit', runCode);
	}
	var runCode= function() {
	    d3.selectAll('.runvalue')[0].forEach(function(input) { 
		var key= input.getAttribute('key');
		progValues[key]=input.value; 
	    });
	    console.log(progValues);
	    runOutput.selectAll('*').remove();
	    code.fold('body', runOutput, function() {
		d3.selectAll('.runvalue')[0].forEach(function(input) { 
		    var key= input.getAttribute('key');
		    input.value= progValues[key]; 
		});
	    });
	};
	var runButton= output.append('input')
	    .attr('type','button')
	    .attr('value','run')
	    .on('click',runCode);
	var runOutput= output.append('svg')
	    .attr('width','100%')
	    .attr('height','50%')
	    .attr('viewBox','-200 -150 400 300');
	runCode();
    },
    arg : function(code, output, callback) {
	var name= code.arg('name').text;
	var value= d3.select('.runvalue[key='+name+']')[0][0].value;
	callback(value);
    },
    withParam : function(code, output, callback) {
	var name= code.arg('name').text;
	code.arg('value').call(output, function(result) {
	    d3.select('.runvalue[key='+name+']')[0][0].value= result;
	    callback(output);
	});
    },
    cmd : {
	'if' : function(code, output, callback) {
	    code.arg('condition').call(output, function(value) {
		if (value)
		    code.fold('body', output, callback);
		else
		    callback(output);
	    });
	},
	value : function(code, output, callback) {
	    code.arg('value').call(output, function() {
		callback(output);
	    });
	},
	call : function(code, output, callback) {
	    code.fold('argument', output, function(result) {
		progFunctions.fun.fold('body', output, callback);
	    });
	}
    }
}



function getArguments(code, args) {
    for (var key in code.argMap) {
	for (var index in code.argMap[key]) {
	    var child= code.argMap[key][index];
	    if (child.type=='prog.arg')
		args[child.arg('name').text]=true;
	    else
		getArguments(child, args);
	}
    }
    return args;
}
