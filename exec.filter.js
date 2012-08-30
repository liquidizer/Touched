commands.filter= {
    apply : function(code, output) {
	output.selectAll('*').remove();
	var svg= output.append('svg')
	    .attr('width','100%').attr('height','100%');

	var filter= svg.append('defs')
	    .append('filter').attr('id','tfilter')

	var img= svg.append('g')
	    .append('image')
	    .attr('xlink:href', code.arg('src').text)
	    .attr('width','200')
	    .attr('height','200');
	img.attr('filter', 'url(#tfilter)')

	var creator= FilterCreator(filter, 'img', 'SourceGraphic');
	var filterCode= code.args('filter');
	filterCode.reverse().forEach(function(cmd) {
	    cmd.call(creator);
	});
	if (filterCode.length==0)
	    img.attr('filter', '')
    },
    fe : {
	merge : {
	    atop : function(code, output) {
		var child= output.fork();
		code.args('filter').reverse().forEach(function(cmd) {
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
	gamma : function(code, output) {
	    var fe= output.append('feComponentTransfer');
	    var ampl= code.arg('amplitude').text || 1;
	    var exp= code.arg('exponent').text || 1;
	    var off= code.arg('offset').text || 0;
	    // error checks
	    if (off <-1 || off>1)
		code.arg('offset').error('Offset must be between -1 and 1');
	    if (ampl <0)
		code.arg('amplitude').error('Amplitude must be positive');
	    if (exp <0)
		code.arg('exponent').error('Exponent must be positive');
	    // create elements
	    var channels=['R','G','B'];
	    channels.forEach(function(channel) {
		fe.append('feFunc'+channel)
		    .attr('type','gamma')
		    .attr('amplitude',ampl)
		    .attr('exponent',exp)
		    .attr('offset',off)
	    });
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
	offset : function(code, output) {
	    output.append('feOffset')
	    .attr('dx', code.arg('dx').text || 0)
	    .attr('dy', code.arg('dy').text || 0);
	},
	sourcegraphic : function(code, output) {
	    output.toSource();
	}
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
	    return FilterCreator(output, base+this.ref+'_', this.in());
	},
        merge : function(name, child) {
	    return output.append(name)
		.attr('in', child.in())
		.attr('in2', this.in())
		.attr('result', base+(++this.ref));
	},
	toSource : function() {
	    this.ref= 0;
	    source='SourceGraphic';
	}
    }
}


