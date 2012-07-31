lsys_debug = false;
lsys_debug_expand = false;
lsys_debug_plot = false;
lsys_debug_perf = true;

lsys_move_count = 0;
lsys_move_length = 0;
lsys_move_limit_enabled = false;
lsys_move_limit = 1000;

lsys_plot_id = 0;
lsys_last_fit = 0;
lsys_last_fill = 0;
lsys_stroke_width = 1;

commands.l= {
    system : function(code, output) {
		lsys_plot_id++;
		lsys_move_count = 0;
		lsys_move_length = 0;
		
		iterations = parseInt(code.arg('iterations').text || "0");
		if (iterations<0) {
			code.arg('iterations').error("iterations must be positive");
			return;
		}
		
		output.selectAll('*').remove();
		
		var svg = output
		.append("svg")
		.attr("width", "100%").attr("height", "100%").attr("style","margin:5pt");
		var g = svg.append('g');
		
		var plotter = new Plotter(svg);
		var tracker = new Tracker(svg[0][0].createSVGMatrix());
		var it = new Iterator([code.arg('axiom')], iterations);
		var rules = code.args('rule');
		
		var startTime = (lsys_debug_perf) ? new Date().getTime() : 0;
		
		plotLSys(plotter, tracker, it, rules, 
			function() { // callback for final fitting of plot into svg viewBox
				plotter.decorate();
				if (lsys_debug_perf) {
					console.log("rendering finished in " + (new Date().getTime()-startTime) + " ms");
				}
			}, 
			function() { // callback for aborting
				plotter.decorate();
				console.log("rendering aborted: move limit reached at " + lsys_move_limit);
			}
		);
    }
}

// holds the svg and its root group to append lsystem elements to
// also offers methods for fitting plot into svg viewBox, adapting line stroke width to fill the area, and final plot decoration
function Plotter(svg) {
	this.svg = svg;
	this.root = svg.append('g').attr('style', 'stroke: black');
	
	// adapt viewBox to global bounding box so that whole figure is visible
	this.fit = function() {
		var viewport = this.root[0][0].getBBox();
		this.svg.attr('viewBox', viewport.x +' '+ viewport.y +' '+ viewport.width +' '+ viewport.height);
	}
	
	// adapt stroke width to global bounding box so that figure lines are equally visible for small and large area
	this.fill = function() {
		if (lsys_move_length == 0) return;
		var viewport = this.root[0][0].getBBox();
		var lines = this.svg.selectAll(".lsystemLine");
		var area = viewport.width * viewport.height;
		var fillFactor = Math.log(area/lsys_move_length);
		var sw = Math.max(1, Math.round(fillFactor));
		if (sw != lsys_stroke_width) {
			var lines = this.svg.selectAll(".lsystemLine");
			lines.style("stroke-width", sw);
			if (lsys_debug_plot) console.log("moves="+lsys_move_count + "   length="+lsys_move_length);
			if (lsys_debug_plot) console.log("area="+area + "   ff="+fillFactor + "   -> sw="+sw);
			if (lsys_debug_plot) console.log("changed stroke width to " + sw);
			lsys_stroke_width = sw;
		}
	}
	
	// final beautification of figure (stuff that would be too slow to do continuously or only has to be done once)
	this.decorate = function() {
		if (lsys_move_length == 0) return;
		
		// final stroke width calculation
		lsys_stroke_width = 0; // reset so that lines are definitely redrawn
		this.fill();
		var lines = this.svg.selectAll(".lsystemLine");
		lines.style("stroke-linecap", "round");
		
		// final viewBox re-calculation as line style changes may have affected bounding box
		viewport = this.root[0][0].getBBox();
		// extra margin of 5 to accommodate stroke line caps
		this.svg.attr('viewBox', (viewport.x-5) +' '+ (viewport.y-5) +' '+ (viewport.width+10) +' '+ (viewport.height+10));
	}
}

// wrapper for transformation matrix; needed because of JavaScript pass-by-value semantics...
function Tracker(matrix) {
	this.matrix = matrix;
	// clone method needed to fork group transforms
	this.clone = function() {
		var clone = new Tracker(this.matrix);
		return clone;
	}
}

// custom iterator; needed for callback implementation of plot/expand recursion
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
function expand(plotter, tracker, iterator, rules, callback, abort) {
	if (iterator.iteration<0) {
		callback();
		return;
	}
	if (lsys_debug) console.log("expand iteration "+(iterations-iterator.iteration));
	
	var elem = iterator.next();
	if (!elem) {
		callback();
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
		var current_plot_id = lsys_plot_id;
		setTimeout(function() {
			if (lsys_plot_id == current_plot_id) {
				var timestamp = new Date().getTime();
				if (timestamp-200 > lsys_last_fit) { // every 200 ms...
					plotter.fit(); // adapt svg viewBox to current plot size
					lsys_last_fit = timestamp;
				}
				if (timestamp-1000 > lsys_last_fill) { // every second...
					plotter.fill(); // adapt line stroke width to scale of current plot size
					lsys_last_fill = timestamp;
				}
				plotLSys(plotter, tracker, it2, rules, callback, abort);
			} else {
				//console.log("aborting plot of deprecated lsystem");
			}
		}, 1);
	}
}

function plotLSys(plotter, tracker, iterator, rules, callback, abort) {
	if (iterator.iteration<0) {
		callback();
		return;
	}
	if (lsys_debug) console.log("plot iteration "+(iterations-iterator.iteration));
	while (iterator.hasNext()) {
		var elem = iterator.next();
		if (!elem) {
			callback();
		} else {
			if (lsys_debug_plot) console.log("elem: " + elem.type);
			m = tracker.matrix;
			if (elem.type == 'l.op.variable') {
				var it2 = new Iterator([elem], iterator.iteration);
				expand(plotter, tracker, it2, rules, function() { // after expanding variable...
					plotLSys(plotter, tracker, iterator, rules, callback, abort); // ...continue current plotting iteration with next element
				}, abort);
				return;
			}
			// for groups, recursively plot content, but use a clone of the current transform matrix
			else if (elem.type == 'l.op.group') {
				var children = elem.args('child');
				var clone = tracker.clone();
				var it2 = new Iterator(children, iterator.iteration);
				plotLSys(plotter, clone, it2, rules, function() { // after plotting group contents...
					plotLSys(plotter, tracker, iterator, rules, callback, abort); // ...continue current plotting iteration with next element
				}, abort);
				return;
			}
			else if (elem.type == 'l.op.move') {
				var len = elem.arg('length').text || 0;
				if (len == 0) continue; // for undefined or zero length we do nothing
				// actual drawing happens here
				plotter.root.append('line')
				.attr('x1', 0).attr('y1', 0).attr('x2', len).attr('y2', 0)
				//.attr('stroke', 'black')
				.attr('class', 'lsystemLine')
				.attr('transform', "matrix("+m.a+","+m.b+","+m.c+","+m.d+","+m.e+","+m.f+")");
				tracker.matrix = m.translate(len, 0);
				if (lsys_debug_plot) console.log("move " + len);
				lsys_move_count++;
				lsys_move_length += (+len);
				if (lsys_move_limit_enabled && (lsys_move_count >= lsys_move_limit)) {
					abort();
					return;
				}
			}
			else if (elem.type == 'l.op.scale') {
				tracker.matrix = m.scale(elem.arg('factor').text);
			}
			else if (elem.type == 'l.op.scalenu') {
				tracker.matrix = m.scaleNonUniform(elem.arg('factorX').text, elem.arg('factorY').text);
			}
			else if (elem.type == 'l.op.rotate') {
				var angle = elem.arg('angle').text || 0;
				if (angle == 0) continue; // for undefined or zero angle we do nothing
				tracker.matrix = m.rotate(angle);
				if (lsys_debug_plot) console.log("turn " + angle);
			}
		}
	}
	callback();
}
