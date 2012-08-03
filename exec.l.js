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
lsys_stroke = "black";
lsys_stroke_width = 1;

lsys_style = "#lsystem {width: 100%; height: 100%; margin: 5px;}";
lsys_style += " #lsystem .decorated {stroke-linecap: round;}";

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
		
		var svg = output.append("svg").attr('id', 'lsystem');
		
		var strokeColor = code.arg('stroke').text || lsys_stroke;
		lsys_custom_style = " #lsystem line {stroke: " + strokeColor + ";}";
		svg.append("style").attr('type','text/css').text(lsys_style + lsys_custom_style);
		
		var plotter = new Plotter(svg);
		var tracker = new Tracker(svg[0][0].createSVGMatrix(), strokeColor);
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
				if (lsys_debug) console.log("rendering aborted");
			}
		);
    }
}

// holds the svg and its root group to append lsystem elements to
// also offers methods for fitting plot into svg viewBox, adapting line stroke width to fill the area, and final plot decoration
function Plotter(svg) {
	this.svg = svg;
	this.root = svg.append('g').attr('id', 'lsystem-root');
	
	// adapt viewBox to global bounding box so that whole figure is visible
	this.fit = function() {
		var viewport = this.root[0][0].getBBox();
		this.svg.attr('viewBox', viewport.x +' '+ viewport.y +' '+ viewport.width +' '+ viewport.height);
	}
	
	// adapt stroke width to global bounding box so that figure lines are equally visible for small and large area
	this.fill = function() {
		if (lsys_move_length == 0) return;
		var viewport = this.root[0][0].getBBox();
		var area = viewport.width * viewport.height;
		var fillFactor = Math.log(area/lsys_move_length);
		var sw = Math.max(1, Math.round(fillFactor));
		if (sw != lsys_stroke_width) {
			//var lines = this.svg.selectAll("#lsystem line");
			//lines.style("stroke-width", sw);
			var root = this.svg.select("#lsystem-root");
			root.style("stroke-width", sw); // styling only the root g element instead of each line reduces SVG disk footprint ALOT
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
		var root = this.svg.select("#lsystem-root");
		root.classed("decorated", true); // toggle beautiful style

		// final viewBox re-calculation as line style changes may have affected bounding box
		viewport = this.root[0][0].getBBox();
		// extra margin of 5 to accommodate stroke line caps
		this.svg.attr('viewBox', (viewport.x-5) +' '+ (viewport.y-5) +' '+ (viewport.width+10) +' '+ (viewport.height+10));
	}
}

// wrapper for transformation matrix; needed because of JavaScript pass-by-value semantics...
function Tracker(matrix, strokeColor) {
	this.matrix = matrix;
	this.strokeColor = strokeColor;
	// clone method needed to fork group transforms
	this.clone = function() {
		var clone = new Tracker(this.matrix, this.strokeColor);
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
			if (elem.type == 'l.op.variable') {
				// expand variable and plot the expanded result
				if (lsys_debug) console.log("expand iteration "+(iterations-iterator.iteration));
				var expanded = []; // store result of this iteration's rules application
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
				if (lsys_debug_expand) console.log(expanded);
				
				var it2 = new Iterator(expanded, iterator.iteration-1);
				var current_plot_id = lsys_plot_id;
				setTimeout(function() {
					if (lsys_plot_id == current_plot_id) {
						var timestamp = new Date().getTime();
						if (timestamp-500 > lsys_last_fit) { // every 200 ms...
							plotter.fit(); // adapt svg viewBox to current plot size
							lsys_last_fit = timestamp;
						}
						if (timestamp-2000 > lsys_last_fill) { // every second...
							plotter.fill(); // adapt line stroke width to scale of current plot size
							lsys_last_fill = timestamp;
						}
						plotLSys(plotter, tracker, it2, rules, function() { // after plotting expansion...
							plotLSys(plotter, tracker, iterator, rules, callback, abort); // ...continue current plotting iteration with next element
						}, abort);
					} else {
						if (lsys_debug) console.log("l-system is deprecated");
						abort();
					}
				}, 1);
				return;
			}
			else if (elem.type == 'l.op.group') {
				// for groups, recursively plot content, but use a clone of the current transform matrix
				var children = elem.args('child');
				var clone = tracker.clone();
				var it2 = new Iterator(children, iterator.iteration);
				plotLSys(plotter, clone, it2, rules, function() { // after plotting group contents...
					plotLSys(plotter, tracker, iterator, rules, callback, abort); // ...continue current plotting iteration with next element
				}, abort);
				return;
			}
			else if (elem.type == 'l.op.move') {
				// actual drawing happens here
				var len = elem.arg('length').text || 0;
				if (len == 0) continue; // for undefined or zero length we do nothing
				var line = plotter.root.append('line')
				.attr('x2', len)
				.attr('transform', "matrix("+tracker.matrix.a+","+tracker.matrix.b+","+tracker.matrix.c+","+tracker.matrix.d+","+tracker.matrix.e+","+tracker.matrix.f+")");
				if (tracker.strokeColor != lsys_stroke) {
					line.style("stroke", tracker.strokeColor);
				}
				tracker.matrix = tracker.matrix.translate(len, 0);
				if (lsys_debug_plot) console.log("move " + len);
				lsys_move_count++;
				lsys_move_length += (+len); // Note: unary + is the fastest way to coerce len to Number type
				if (lsys_move_limit_enabled && (lsys_move_count >= lsys_move_limit)) {
					console.log("move limit reached at " + lsys_move_limit);
					abort();
					return;
				}
			}
			else if (elem.type == 'l.op.scale') {
				var f = elem.arg('factor').text || 1.0;
				if (f == 1.0) continue; // for undefined factor or factor 1.0 we do nothing (Note: f is coerced to Number type internally)
				tracker.matrix = tracker.matrix.scale(f);
				if (lsys_debug_plot) console.log("scale " + f);
			}
			else if (elem.type == 'l.op.scalenu') {
				var fx = elem.arg('factorX').text || 1.0;
				var fy = elem.arg('factorY').text || 1.0;
				if ((fx == 1.0) && (fy == 1.0)) continue; // do nothing if both factors are undefined or 1.0
				tracker.matrix = tracker.matrix.scaleNonUniform(fx, fy);
				if (lsys_debug_plot) console.log("scalenu " + fx + " " + fy);
			}
			else if (elem.type == 'l.op.rotate') {
				var angle = elem.arg('angle').text || 0;
				if (angle == 0) continue; // for undefined or zero angle we do nothing
				tracker.matrix = tracker.matrix.rotate(angle);
				if (lsys_debug_plot) console.log("turn " + angle);
			}
			else if (elem.type == 'l.op.color') {
				var c = elem.arg('color').text;
				if (!c) continue; // for undefined or zero color we do nothing
				tracker.strokeColor = c; // store new color to use for subsequent moves
				if (lsys_debug_plot) console.log("color " + c);
			}
		}
	}
	callback();
}
