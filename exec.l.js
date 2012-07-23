commands.l= {
    system : function(code, output) {
		var iterations= parseInt(code.arg('iterations').text || "0");
		if (iterations>8) {
			code.arg('iterations').error("Maximum iterations reached");
			return;
		}
		if (iterations<0) {
			code.arg('iterations').error("Minimum iterations reached");
			return;
		}
		output.selectAll('*').remove();
		//output.append('h1').text('L-System');
		//output.append('p').text('Iterations: '+iterations);
		code.fold('rule', {}, function(result) {
			/*output.append('h3').text("Rules");
				var u= output.append('ul');
				for (i in result) {
					u.append('li').text(i+' -> '+result[i]);
				}*/
			var res = expand(code.arg('axiom').arg('name').text, iterations, result);
			//console.log("I"+iterations + ": " + res);
		
		var svg = output
		.append("svg")
		.attr("width", "100%").attr("height", "100%");
		var matrix= svg[0][0].createSVGMatrix();
		var g = svg.append('g');
		
		plot(g, matrix, res);
		
		// adapt viewBox to global bounding box so that whole figure is visible
		var viewport=g[0][0].getBBox();
		// extra margin of 5 to accommodate stroke line caps
		svg.attr('viewBox', (viewport.x-5) +' '+ (viewport.y-5) +' '+ (viewport.width+10) +' '+ (viewport.height+10));
		
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

function expand(input, maxIter, rules) {
	for (var iter=0; iter<maxIter; iter++) {
		for (key in rules) {
			input= input.replace(new RegExp(key, 'g'), rules[key]);
		}
	}
	return input;
}

function plot(output, m, lcode) {
	var len=10;
	for (var i=0; i<lcode.length; i++) {
		if (lcode[i]=='F') {
			/*output.append('rect')
			.attr('height','2')
			.attr('width',len)*/
			output.append('line')
			.attr('x1', 0).attr('y1', 0).attr('x2', len).attr('y2', 0)
			.attr('stroke', 'black')
			.attr('stroke-width', 2)
			.attr('stroke-linecap', 'round')
			.attr('transform', "matrix("+m.a+","+m.b+","+m.c+","+m.d+","+m.e+","+m.f+")");
			m=m.translate(len, 0);
		}
		else if  (lcode[i]=='+') {
			m=m.rotate(45);
		}
		else if (lcode[i]=='-') {
			m=m.rotate(-45);
		}
	}		
}
