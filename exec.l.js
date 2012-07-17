commands.l= {
    system : function(code, output) {
		output.selectAll('*').remove();
		//code.arg('root-node').call(output);
		output.append('h1').text('L-System');
		var iterations= parseInt(code.arg('iterations').text || "0");
		if (!iterations || iterations>8) {
			code.arg('iterations').error("Maximum iterations reached");
			return;
		}
		output.append('p').text('Iterations: '+iterations);
		code.fold('rule', {}, function(result) {
			output.append('h3').text("Rules");
				var u= output.append('ul');
				for (i in result) {
					u.append('li').text(i+' -> '+result[i]);
				}
		});
    },
    rule : function(code, input, callback) {
		var rule= { in: code.arg('in').text, out: code.arg('out').text, code: code};
		if (rule.in && rule.out) {
			if (input[rule.in])
				code.error('Left-hand-side must be unique');
			else
				input[rule.in]=rule.out;
		}
		callback(input);
    }
}

