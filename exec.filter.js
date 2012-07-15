commands.filter= {
    apply : function(code, output) {
	output.selectAll('*').remove();
	var svg= output.append('svg')
	    .attr('width','100%').attr('height','100%');

	var filter= svg.append('defs')
	    .append('filter').attr('id','tfilter')

	createFilters(code.args('filter'), filter);
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

function createFilters(cmds, output) {
    cmds.each(function(i, cmd) {
	cmd.call(output);
    });
    var out='background';
    output.selectAll('*').forEach( function(fe) {
	console.log(fe);
	console.log(fe.attr);
	return;
	fe.attr('in', out);
	out= 'img'+Math.random();
	fe.attr('out',out);
    });
}