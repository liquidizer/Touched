
commands.economy= {
    model : function(code, output, callback) {
	result= {};
	var f= function(data) {
	    var no= data._scenario;
	    var time= data._time;
	    if (time>0) {
		for (key in data) {
		    if (!key.match(/^_/)) {
			result[key] || (result[key]= []);
			result[key][no] || (result[key][no]= [[0,0]]);
			result[key][no].push([time, data[key]]);
		    }
		}
	    }
	    if (time<20) {
		data._time++;
		code.fold('actor', data, f);
	    } else {
		if (no<=20) {
		    setTimeout(function() {
			f({ _time : 0, _scenario : no+1 });
		    },1);
		} else
		    plotEconomy(result, output, callback);
	    }
	}
	f({ _scenario : 0, _time : 0 });
    },
    actor : function(code, data, callback) {
	data._unit= 1.0;
	code.fold('action', data, callback);
    },
    action : {
	produce : function(code, data, callback) {
	    var field= code.arg('resource').text;
	    data[field]= (data[field] || 0) + data._unit;
	    callback(data);
	},
	consume : function(code, data, callback) {
	    var field= code.arg('resource').text;
	    data[field]= (data[field] || 0) - data._unit;
	    callback(data);
	},
	decay : function(code, data, callback) {
	    var field= code.arg('resource').text;
	    var hlf= parseFloat(code.arg('halflife').text);
	    data[field]= (data[field] || 0) * Math.pow(0.5, 1/hlf);
	    callback(data);
	},
	noisyscale : function(code, data, callback) {
	    var mean= parseFloat(code.arg('mean').text);
	    var sigma= parseFloat(code.arg('sigma').text);
	    var noise= 0;
	    for (var j=0; j<12; ++j) noise= noise+Math.random()-0.5;
	    var oldunit= data._unit;
	    data._unit= data._unit * (mean + sigma * noise);
	    code.fold('action', data, function() {
		data._unit= oldunit;
		callback(data);
	    });
	},

    }
}

function plotEconomy(data, output, callback) {
    output.selectAll('*').remove();
    for (key in data) {
	output.append('h1').text('Booked amount: '+key);
	plotAmount(data[key], output);
    }
    callback && callback();
}

function plotAmount(data, output) {
    var color = d3.scale.category20();
    var x =  d3.scale.linear()
	.domain([d3.min(d3.min(data), function(row) {return row[0];}), 
		 d3.max(d3.max(data), function(row) {return row[0];})])
	.range([0, 300]);

    var y = d3.scale.linear()
	.domain([d3.min(data, function(scen) { return d3.min(scen, function(row) {return row[1];}); }), 
		 d3.max(data, function(scen) { return d3.max(scen, function(row) {return row[1];}); })])
	.range([200, 0]);

    var xAxis = d3.svg.axis()
	.scale(x)
	.orient("bottom");

    var yAxis = d3.svg.axis()
	.scale(y)
	.orient("left");

    var svg = output
	.append("svg")
	.attr("width", "400")
	.attr("height", "250")
	.append("g")
	.attr('transform','translate(50,10)');

    svg.append("g")
	.attr("class", "axis")
	.attr("transform", "translate(0,200)")
	.call(xAxis);

    svg.append("g")
	.attr("class", "axis")
	.call(yAxis); 

    var lines= svg.selectAll(".line")
    var line = d3.svg.line()
	.x(function(d) { return x(d[0]);})
	.y(function(d) { return y(d[1]);});

    lines.data(data) 
	.enter()
	.append("path")
	.style('fill','none')
        .style('stroke', 'black')
	.style('stroke-width', '1px')
	.attr("d", line)
	.style("stroke",  function(d, i) {return color(i);}); 

} 
