lsys_debug = false;
lsys_debug_expand = false;
lsys_debug_plot = false;

commands.l= {
    system : function(code, output) {
		iterations= parseInt(code.arg('iterations').text || "0");
		if (iterations>8) {
			code.arg('iterations').error("Maximum iterations reached");
			return;
		}
		if (iterations<0) {
			code.arg('iterations').error("Minimum iterations reached");
			return;
		}
		output.selectAll('*').remove();
		
		var svg = output
		.append("svg")
		.attr("width", "100%").attr("height", "100%");
		var g = svg.append('g');
		var tracker = new Tracker(svg[0][0]);
		
		plot(g, tracker, iterations, new Array(code.arg('axiom')), code.args('rule'));
		
		// adapt viewBox to global bounding box so that whole figure is visible
		var viewport = g[0][0].getBBox();
		// extra margin of 5 to accommodate stroke line caps
		svg.attr('viewBox', (viewport.x-5) +' '+ (viewport.y-5) +' '+ (viewport.width+10) +' '+ (viewport.height+10));
    }
}

// wrapper object for transformation matrix; needed because of JavaScript pass-by-value semantics...
function Tracker(svg) {
	this.svg = svg;
	this.matrix = this.svg.createSVGMatrix();
	// clone method needed to fork group transforms
	this.clone = function() {
		var clone = new Tracker(this.svg);
		clone.matrix = this.matrix;
		return clone;
	}
}

// expand one input variable; calls plot on the expanded result
function expand(output, tracker, iteration, input, rules) {
	if (iteration<0) return;
	if (lsys_debug) console.log("Expand Iteration "+(iterations-iteration));
	
	var expanded = []; // store result of this iteration's rules application
	if (input.type == 'l.op.variable') {
		var varName = input.arg('name').text;
		if (lsys_debug_expand) console.log("expanding var " + varName);
		for (r in rules) {
			var rule = rules[r];
			var r_in = rule.arg('in');
			var r_outs = rule.args('out');
			if (varName == r_in.arg('name').text) {
				expanded = expanded.concat(r_outs);
			}
		}
	}
	if (lsys_debug_expand) console.log(expanded);
	plot(output, tracker, iteration-1, expanded, rules);
}

// plot input; calls expand on variables and calls plot with cloned transform matrix on groups
function plot(output, tracker, iteration, input, rules) {
	if (iteration<0) return;
	if (input.length==0) return;
	if (lsys_debug) console.log("Plot Iteration "+(iterations-iteration));
	
	input.forEach(function(elem) {
		m = tracker.matrix;
		if (lsys_debug) console.log("input: " + elem.type);
		// if we encounter variables, expand them
		if (elem.type == 'l.op.variable') {
			expand(output, tracker, iteration, elem, rules);
		}
		// for other operators, execute them
		else if (elem.type=='l.op.move') {
			var len= elem.arg('length').text;
			// actual drawing happens here
			output.append('line')
			.attr('x1', 0).attr('y1', 0).attr('x2', len).attr('y2', 0)
			.attr('stroke', 'black')
			.attr('stroke-width', 2)
			.attr('stroke-linecap', 'round')
			.attr('transform', "matrix("+m.a+","+m.b+","+m.c+","+m.d+","+m.e+","+m.f+")");
			tracker.matrix=m.translate(len, 0);
			if (lsys_debug_plot) console.log("move " + len);
			if (lsys_debug_plot) console.log(m);
		}
		else if (elem.type=='l.op.scale') {
			tracker.matrix=m.scale(elem.arg('factor').text);
		}
		else if (elem.type=='l.op.scalenu') {
			tracker.matrix=m.scaleNonUniform(elem.arg('factorX').text, elem.arg('factorY').text);
		}
		else if (elem.type=='l.op.rotate') {
			var angle = elem.arg('angle').text;
			tracker.matrix=m.rotate(angle);
			if (lsys_debug_plot) console.log("turn " + angle);
			if (lsys_debug_plot) console.log(m);
		}
		// for groups, recursively plot content, but use a clone of the current transform matrix
		else if (elem.type=='l.op.group') {
			var children = elem.args('child');
			var clone = tracker.clone();
			plot(output, clone, iteration-1, children, rules);
		}
	});
}
