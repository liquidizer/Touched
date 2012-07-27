lsys_debug = false;
lsys_debug_expand = false;
lsys_debug_plot = false;
lsys_move_count = 0;
lsys_move_limit = 10000;
lsys_drawcount = 0;
lsys_lastaction = 0;

commands.l= {
    system : function(code, output) {
		lsys_drawcount++;
		lsys_move_count = 0;
		iterations = parseInt(code.arg('iterations').text || "0");
		/*if (iterations>8) {
			code.arg('iterations').error("Maximum iterations reached");
			return;
		}*/
		if (iterations<0) {
			code.arg('iterations').error("Minimum iterations reached");
			return;
		}
		output.selectAll('*').remove();
		
		var svg = output
		.append("svg")
		.attr("width", "100%").attr("height", "100%");
		var g = svg.append('g');
		
		svg.selectAll('g');
		
		var tracker = new Tracker(svg, g);
		var it = new Iterator([code.arg('axiom')], iterations);
		var rules = code.args('rule');
		
		try {
			plotLSys(tracker, it, rules, function() {
				tracker.fit();
				//console.log(tracker.svg[0][0]);
			});
		} catch (err) {
			if (err=="lsys_move_limit_reached") {
				console.log("WARNING: move limit reached at " + lsys_move_limit);
				return;
			}
			throw err;
		} finally {
			tracker.fit();
		}
		
    }
}

// wrapper object for transformation matrix; needed because of JavaScript pass-by-value semantics...
function Tracker(svg, root) {
	this.svg = svg;
	this.root = root;
	this.matrix = this.svg[0][0].createSVGMatrix();
	// clone method needed to fork group transforms
	this.clone = function() {
		var clone = new Tracker(this.svg, this.root);
		clone.matrix = this.matrix;
		return clone;
	}
	this.fit = function() {
		// adapt viewBox to global bounding box so that whole figure is visible
		var viewport = this.root[0][0].getBBox();
		// extra margin of 5 to accommodate stroke line caps
		this.svg.attr('viewBox', (viewport.x-5) +' '+ (viewport.y-5) +' '+ (viewport.width+10) +' '+ (viewport.height+10));
	}
}

function Iterator(input, iteration) {
	this.index = 0;
	this.input = input;
	this.iteration = iteration;
	
	this.hasNext = function() {
		if (!input) return false;
		if (this.index >= this.input.length) {
			return false;
		}
		return true;
	}
	
	this.next = function() {
		if (!input) return null;
		if (this.index >= this.input.length) {
			return null;
		}
		var elem = this.input[this.index];
		this.index++;
		return elem;
	}
}

// expand input variables; calls plot on the expanded result
function expand(tracker, iterator, rules, callback) {
	if (iterator.iteration<0) {
		callback(tracker);
		return;
	}
	if (lsys_debug) console.log("Expand Iteration "+(iterations-iterator.iteration));
	
	var elem = iterator.next();
	if (!elem) {
		callback(tracker);
	} else {
		var expanded = []; // store result of this iteration's rules application
		if (elem.type == 'l.op.variable') {
			var varName = elem.arg('name').text;
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
		var it2 = new Iterator(expanded, iterator.iteration-1);
		var old_drawcount = lsys_drawcount;
		setTimeout(function() {
			if (lsys_drawcount==old_drawcount) {
				if (new Date().getTime()-100 > lsys_lastaction) {
					tracker.fit();
					lsys_lastaction = new Date().getTime();
				}
				plotLSys(tracker, it2, rules, callback);
			}
		}, 1);
	}
}

function plotLSys(tracker, iterator, rules, callback) {
	if (iterator.iteration<0) {
		callback(tracker);
		return;
	}
	if (lsys_debug) console.log("Plot Iteration "+(iterations-iterator.iteration));
	while (iterator.hasNext()) {
		var elem = iterator.next();
		if (!elem) {
			callback(tracker);
		} else {
			if (lsys_debug) console.log("elem: " + elem.type);
			m = tracker.matrix;
			if (elem.type=='l.op.variable') {
				var it2 = new Iterator([elem], iterator.iteration);
				expand(tracker, it2, rules, function() { // after expanding variable...
					plotLSys(tracker, iterator, rules, callback); // ...continue current plotting iteration with next element
				});
				return;
			}
			// for groups, recursively plot content, but use a clone of the current transform matrix
			else if (elem.type=='l.op.group') {
				var children = elem.args('child');
				var clone = tracker.clone();
				var it2 = new Iterator(children, iterator.iteration);
				plotLSys(clone, it2, rules, function() { // after plotting group contents...
					plotLSys(tracker, iterator, rules, callback); // ...continue current plotting iteration with next element
				});
				return;
			}
			else if (elem.type=='l.op.move') {
				var len = elem.arg('length').text || 0;
				if (len == 0) return; // for undefined or zero length we do nothing
				// actual drawing happens here
				tracker.root.append('line')
				.attr('x1', 0).attr('y1', 0).attr('x2', len).attr('y2', 0)
				.attr('stroke', 'black')
				.attr('stroke-width', 2)
				.attr('stroke-linecap', 'round')
				.attr('transform', "matrix("+m.a+","+m.b+","+m.c+","+m.d+","+m.e+","+m.f+")");
				tracker.matrix=m.translate(len, 0);
				if (lsys_debug_plot) console.log("move " + len);
				lsys_move_count++;
				if (lsys_move_count >= lsys_move_limit) {
					throw "lsys_move_limit_reached";
				}
			}
			else if (elem.type=='l.op.scale') {
				tracker.matrix=m.scale(elem.arg('factor').text);
			}
			else if (elem.type=='l.op.scalenu') {
				tracker.matrix=m.scaleNonUniform(elem.arg('factorX').text, elem.arg('factorY').text);
			}
			else if (elem.type=='l.op.rotate') {
				var angle = elem.arg('angle').text || 0;
				if (angle == 0) return; // for undefined or zero angle we do nothing
				tracker.matrix=m.rotate(angle);
				if (lsys_debug_plot) console.log("turn " + angle);
			}
		}
	}
	callback(tracker);
}
