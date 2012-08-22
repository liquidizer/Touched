var plotter;
var rules;

lsys_move_count = 0;
lsys_move_length = 0;
lsys_call_depth = 0;

lsys_plot_id = 0;
lsys_last_fit = 0;
lsys_last_fill = 0;
lsys_stroke = "black";
lsys_stroke_width = 1;

lsys_style = "#lsystem {width: 100%; height: 85%; margin: 5px;}";
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
	
	plotter = new Plotter(svg);
	rules = code.args('rule');

	var tracker = new Tracker(svg[0][0].createSVGMatrix(), strokeColor);
	tracker.current_plot_id= lsys_plot_id;
	tracker.it = new Iterator([code.arg('axiom')], iterations);
	
	plotLSys(tracker,
		 function() { // callback for final fitting of plot into svg viewBox
		     plotter.decorate();
		 });
    },
    op : {
	rotate : function(code, tracker, callback) {
	    var angle = getNumber(code.arg('angle')) || 0;
	    tracker.matrix = tracker.matrix.rotate(angle);
	    callback(tracker);
	},
	color : function(code, tracker, callback) {
	    var c = code.arg('color').text || 'black';
	    tracker.strokeColor = c;
	    callback(tracker);
	},
	scale : function(code, tracker, callback) {
	    var f = getNumber(code.arg('factor')) || 1.0;
	    tracker.matrix = tracker.matrix.scale(f);
	    callback(tracker);
	},
	scalenu : function(code, tracker, callback) {
	    var fx = getNumber(code.arg('factorX')) || 1.0;
	    var fy = getNumber(code.arg('factorY')) || 1.0;
	    tracker.matrix = tracker.matrix.scaleNonUniform(fx, fy);
	    callback(tracker);
	},
	move : function(code, tracker, callback) {
	    // actual drawing happens here
	    var len = getNumber(code.arg('length')) || 1.0;
	    var m= tracker.matrix;
	    var line = plotter.root.append('line')
		.attr('x2', len)
		.attr('transform', "matrix("+m.a+","+m.b+","+m.c+","+m.d+","+m.e+","+m.f+")")
	        .style('stroke', tracker.strokeColor);
	    tracker.matrix = tracker.matrix.translate(len, 0);
	    lsys_move_count++;
	    lsys_move_length += (+len); // Note: unary + is the fastest way to coerce len to Number type
	    callback(tracker);
	},
	group : function(code, tracker, callback) {
	    // for groups, recursively plot content, but use a clone of the current transform matrix
	    var children = code.args('child');
	    var tracker2 = tracker.clone();
	    tracker2.it = new Iterator(children, tracker.it.iteration);
	    plotLSys(tracker2, function() { // after plotting group contents...
		plotLSys(tracker, callback); // ...continue current plotting iteration with next element
	    });
	},
	variable : function(code, tracker, callback) {
	    // expand variable and plot the expanded result
	    var expanded = []; // store result of this iteration's rules application
	    var varName = code.arg('name').text;
	    for (r in rules) {
		var rule = rules[r];
		var r_in = rule.arg('in');
		var r_outs = rule.args('out');
		if (varName == r_in.arg('name').text) {
		    expanded = expanded.concat(r_outs);
		}
	    }
	    var it0= tracker.it;
	    tracker.it = new Iterator(expanded, tracker.it.iteration-1);
	    var current_plot_id = lsys_plot_id;
	    var nextStep= function() {
		var timestamp = new Date().getTime();
		if (timestamp-300 > lsys_last_fit) { // every 200 ms...
		    plotter.fit(); // adapt svg viewBox to current plot size
		    lsys_last_fit = timestamp;
		}
		if (timestamp-1000 > lsys_last_fill) { // every second...
		    plotter.fill(); // adapt line stroke width to scale of current plot size
		    lsys_last_fill = timestamp;
		}
		plotLSys(tracker, function() { // after plotting expansion...
		    tracker.it= it0;
		    plotLSys(tracker, callback); 
		});
	    };
	    if (lsys_call_depth++ > 100) {
		lsys_call_depth= 0;
		setTimeout(nextStep, 1);
	    } else {
		nextStep();
	    }
	}
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
	    clone.current_plot_id= this.current_plot_id;
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

// returns deterministic value for 'number' types and random integer or float value for 'math.random' types
function getNumber(code, useInteger) {
	if (code.type=='number') {
		return code.text;
	} else if (code.type=='math.random') {
	    var min = +(code.arg('min').text || 0);
	    var max = +(code.arg('max').text || 1);
	    return getRandomFloat(min, max);
	}
}

// generates random float in range [min, max), i.e. exclusive
function getRandomFloat(min, max) {
	var r = min + Math.random()*(max-min); // this is exclusive, so max will actually never be returned
	//console.log("generating random float between " + min + " and " + max + ": " + r);
	return r;
}

function plotLSys(tracker, callback) {
    if (lsys_plot_id != tracker.current_plot_id) return;
    var iterator= tracker.it;
    if (iterator.iteration<0 || !iterator.hasNext()) {
	callback();
    } else {
	iterator.next().call(tracker, function() {
	    plotLSys(tracker, callback);
	});
    }
}
