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

	svg.append('g')
	    .append('image')
	    .attr('filter', 'url('+window.location+'#tfilter)')
	    .attr('xlink:href', code.arg('src').text)
	    .attr('width','200')
	    .attr('height','200');

	//code.arg('root-node').call(output);
    },
    fe : {
	blur : function(code, output) {
	    output.append('feGaussianBlur')
		.attr('stdDeviation', code.arg('sigma').text || '0');
	}
    }
}

