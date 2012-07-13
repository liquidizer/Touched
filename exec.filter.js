commands.filter= {
    apply : function(code, output) {
	output.selectAll('*').remove();
	var svg= output.append('svg')
	    .attr('width','100%').attr('height','100%');
	
	var filter= svg.append('defs')
	    .append('filter').attr('id','tfilter')

	code.args('filter').each(function(i, cmd) {
	    cmd.call(filter);
	});

	var img= svg.append('g')
	    .append('image')
	    .attr('xlink:href', code.arg('src').text)
	    .attr('width','200')
	    .attr('height','200');

	if (!filter.select('*').empty()) {
	    myurl= window.location.href.replace(/[#?].*$/,'');
	    img.attr('filter', 'url('+myurl+'#tfilter)')
	}

	//code.arg('root-node').call(output);
    },
    fe : {
	blur : function(code, output) {
	    if (!(parseFloat(code.arg('sigma').text)>=0))
		code.arg('sigma').error('Invalid value');
	    else
		output.append('feGaussianBlur')
		.attr('stdDeviation', code.arg('sigma').text || '0');
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
	lumalpha : function(code, output) {
	    output.append('feColorMatrix')
		.attr('type','luminanceToAlpha');
	},
    }
}

