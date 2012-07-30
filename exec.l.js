lsys_debug = false;
lsys_debug_expand = false;
lsys_debug_plot = false;
lsys_debug_perf = false;
lsys_move_count = 0;
lsys_move_limit = 10000;
lsys_drawcount = 0;
lsys_lastaction = 0;

commands.l= {
    system : function(code, output) {
		lsys_drawcount++;
		lsys_move_count = 0;
		lsys_bbox_x_min = 0;
		lsys_bbox_y_min = 0;
		lsys_bbox_x_max = 0;
		lsys_bbox_y_max = 0;
		
		iterations = parseInt(code.arg('iterations').text || "0");
		if (iterations<0) {
			code.arg('iterations').error("Iterations must be positive");
			return;
		}
		
		output.selectAll('*').remove();
		
		var svg = output
		.append("svg")
		.attr("width", "100%").attr("height", "100%");
		var g = svg.append('g');
		
		var tracker = new Tracker(svg, g);
		var it = new Iterator([code.arg('axiom')], iterations);
		var rules = code.args('rule');
		
		var startTime = (lsys_debug_perf) ? new Date().getTime() : 0;
		
		plotLSys(tracker, it, rules, 
			function() { // callback for final fitting of plot into svg viewBox
				tracker.fit();
				if (lsys_debug_perf) {
					var endTime = new Date().getTime();
					console.log("rendering finished in " + (endTime-startTime) + " ms");
				}
			}, 
			function() { // callback for aborting
				console.log("rendering aborted: move limit reached at " + lsys_move_limit);
			}
		);
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
		// extra margin of 5 to accommodate stroke line caps
		
		//var viewport = this.root[0][0].getBBox();
		//this.svg.attr('viewBox', (viewport.x-5) +' '+ (viewport.y-5) +' '+ (viewport.width+10) +' '+ (viewport.height+10));
		
		var w=lsys_bbox_x_max-lsys_bbox_x_min;
		var h=lsys_bbox_y_max-lsys_bbox_y_min;
		this.svg.attr('viewBox', (lsys_bbox_x_min-5) +' '+ (lsys_bbox_y_min-5) +' '+ (w+10) +' '+ (h+10));
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
function expand(tracker, iterator, rules, callback, abort) {
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
					tracker.fit(); // adapt svg viewBox to current plot size
					lsys_lastaction = new Date().getTime();
				}
				plotLSys(tracker, it2, rules, callback, abort);
			}
		}, 1);
	}
}

function plotLSys(tracker, iterator, rules, callback, abort) {
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
					plotLSys(tracker, iterator, rules, callback, abort); // ...continue current plotting iteration with next element
				}, abort);
				return;
			}
			// for groups, recursively plot content, but use a clone of the current transform matrix
			else if (elem.type=='l.op.group') {
				var children = elem.args('child');
				var clone = tracker.clone();
				var it2 = new Iterator(children, iterator.iteration);
				plotLSys(clone, it2, rules, function() { // after plotting group contents...
					plotLSys(tracker, iterator, rules, callback, abort); // ...continue current plotting iteration with next element
				}, abort);
				return;
			}
			else if (elem.type=='l.op.move') {
				var len = elem.arg('length').text || 0;
				if (len == 0) continue; // for undefined or zero length we do nothing
				// actual drawing happens here
				tracker.root.append('line')
				.attr('x1', 0).attr('y1', 0).attr('x2', len).attr('y2', 0)
				.attr('stroke', 'black')
				.attr('stroke-width', 2)
				.attr('stroke-linecap', 'round')
				.attr('transform', "matrix("+m.a+","+m.b+","+m.c+","+m.d+","+m.e+","+m.f+")");
				tracker.matrix=m.translate(len, 0);
				with (Math) {
					lsys_bbox_x_min = min(lsys_bbox_x_min, tracker.matrix.e);
					lsys_bbox_y_min = min(lsys_bbox_y_min, tracker.matrix.f);
					lsys_bbox_x_max = max(lsys_bbox_x_max, tracker.matrix.e);
					lsys_bbox_y_max = max(lsys_bbox_y_max, tracker.matrix.f);
				}
				if (lsys_debug_plot) console.log("move " + len);
				lsys_move_count++;
				if (lsys_move_count >= lsys_move_limit) {
					abort();
					return;
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
				if (angle == 0) continue; // for undefined or zero angle we do nothing
				tracker.matrix=m.rotate(angle);
				if (lsys_debug_plot) console.log("turn " + angle);
			}
		}
	}
	callback(tracker);
}
