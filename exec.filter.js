commands.filter= {
    apply : function(code, output) {
	output.selectAll('*').remove();
	var svg= output.append('svg')
	    .attr('width','100%').attr('height','100%');

	var filter= svg.append('defs')
	    .append('filter').attr('id','tfilter')
	var creator= FilterCreator(filter, 'img', 'SourceGraphic');
	code.args('filter').forEach(function(cmd) {
	    cmd.call(creator);
	});

	var img= svg.append('g')
	    .append('image')
	    .attr('xlink:href', code.arg('src').text)
	    .attr('width','200')
	    .attr('height','200');

	if (!filter.select('*').empty()) {
	    img.attr('filter', 'url(#tfilter)')
	}
    },
    fe : {
	merge : {
	    atop : function(code, output) {
		var child= output.fork();
		code.args('filter').forEach(function(cmd) {
		    cmd.call(child);
		});
		output.merge('feComposite', child)
		    .attr('operator','atop');
	    }
	},
	blur : function(code, output) {
	    var sigma= parseFloat(code.arg('sigma').text);
	    if (!(sigma>=0)) code.arg('sigma').error('Invalid value');
	    output.append('feGaussianBlur')
		.attr('stdDeviation', Math.max(sigma,0));
	},
	flood : function(code, output) {
	    output.append('feFlood')
		.attr('flood-color',code.arg('color').text);
	},
	huerotate : function(code, output) {
	    output.append('feColorMatrix')
		.attr('type','hueRotate')
		.attr('values',code.arg('hue').text);
	},
	image : function(code, output) {
	    output.append('feImage')
		.attr('xlink:href', code.arg('src').text)
		.attr('width','200')
		.attr('height','200');
	},
	lumalpha : function(code, output) {
	    output.append('feColorMatrix')
		.attr('type','luminanceToAlpha');
	},
    }
}

function FilterCreator(output, base, source) {
    return {
	ref : 0,
	in : function() {
	    return this.ref ? base+this.ref : source;
	},
	append : function(name) {
	    return output.append(name)
		.attr('in', this.in())
		.attr('result', base+(++this.ref));
	},
	fork : function() {
	    return FilterCreator(output, '_', this.in());
	},
        merge : function(name, child) {
	    return output.append(name)
		.attr('in', child.in())
		.attr('in2', this.in())
		.attr('result', base+(++this.ref));
	}
    }
}


