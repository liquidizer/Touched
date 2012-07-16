// list of commands available in this grammar
commands.d3= {
    script : processScript,
    cmd: { // function(code, output)
	caption: processCaption,
	table: processTable,
	line : processLine
    },
    filter: { // data= function(code, data)
	removerow: removeRows,
	keeprow: keepRows,
	removecolumn: removeColumns,
	keepcolumn: keepColumns,
	transpose: transposeFilter,
	sort : sortData,
	selectcolumnbyvalue : selectColumnbyValue
    },
    data: {
	csv : processData
    },
    plotoption:{// function(code, options)
	XAxis : getXAxis,
	size : getSize
    }
};

function processScript(code, output) {
    output.selectAll('*').remove();
    code.args('command').forEach( function (cmd) {
        var root= output.append('div');
	cmd.call(root);
    });
}

function processCaption(code, output) {
    output.append('h1').text(code.arg('caption').text);
}

function processTable(code, output) {
    output.append('p').text('rendering table...');
    code.arg('data').call(function (data) {
        tabulate(data, output);
        output.select('p').remove();
    });
}

function processLine(code, output){
    output.append('p').text('rendering LinePlot...');
    code.arg('data').call(function (data) {
        var options={
            size: [300,200],
            xaxis : undefined
            };
        code.args('option').forEach(function(cmd) {
		cmd.call(options);
        });
        plotData(options, data, output);
        output.select('p').remove();
    });
}

function processData(code, callback) {
    var file= code.arg('filename');
    if (file.text) d3.text(file.text, function(data) {
	if (!data) 
	    file.error("Could not read file");
	else {
	    data= d3.csv.parseRows(data);
	    data= processDataFilters(code, data);
	    callback(data);
	}
    });
}

function processDataFilters(code, data) {
    code.args('filter').forEach(function (cmd) {
	data= cmd.call(data) || data;
    });
    return data;
}

function getRange(code) {
    if (code.type=='number') return {
        contains: function(x) { return x==parseFloat(code.text); }};
    else if(code.type == 'text') return{
        contains: function(x) { return x==code.text; }};
    else if (code.type== 'range') {
        return {
            contains: function(x) {
                return x>=parseFloat(code.arg('start').text) &&
                       x<=parseFloat(code.arg('end').text);
            }};
    }
    else if (!code.type) {
	return { contains: function() { return false; } };
    }
}

function removeRows(code, data) {
    var range= getRange(code.arg('rows'));
    return data.filter (function ( i, index) { return !range.contains(index+1); });
}

function keepRows(code, data) {
    var range= getRange(code.arg('rows'));
    return data.filter (function (i, index) { return range.contains(index+1); });
}

function removeColumns(code, data) {
    var range= getRange(code.arg('columns'));
    return data.map(function (row, i) {
        return row.filter (function (ele,i) { return !range.contains(i+1); });
    });
}

function keepColumns(code, data) {
    var range= getRange(code.arg('columns'));
    return data.map(function (row, i) {
        return row.filter (function (ele,i) { return range.contains(i+1); });
    });
}

function selectColumnbyValue(code, data) {
    var rownumber = parseFloat(code.arg('rownumber').text);    
    var range = getRange(code.arg('value'));    
    data = transpose(data);   
    data = data.filter(function (ele,index) { return range.contains(ele[rownumber-1]); });
    data = transpose(data);
    return data ;
}

function transposeFilter(code, data) {
    return transpose(data);
}

function sortData(code, data){
    var column =parseFloat(code.arg('column').text);
    if (!(column>0)) code.arg('column').error("Invalid column"); 
    data = transpose(data);
    data.sort(function(a,b){return a[column-1]-b[column-1];});
    data = transpose(data);
    return data;
}

function getXAxis(code, options){
    options.xaxis=parseFloat(code.arg('column').text);
}

function getSize(code, options){
    options.size[0]=parseFloat(code.arg('width').text);
    options.size[1]=parseFloat(code.arg('height').text);
}

function transpose(data) {
    var w = data.length,
        h = w && data[0].length;
    var i, j, t = [];
    for (i = 0; i < h; i++) {
        // Insert a new row (array)
        t[i] = [];
        // Loop through every item per item in outer array (width)
        for (j = 0; j < w; j++) {
            // Save transposed data.
            t[i][j] = data[j][i];
        }
    }
    return t;
}

function plotData(options, processeddata, root) {
    var size = options.size;
    var xAxis = processeddata[options.xaxis-1];
    if(xAxis)
        processeddata.splice(options.xaxis-1,1);
    var dataPlot = getData(processeddata,xAxis);
    plot(root,dataPlot,size);
}

function getData(value, xAxis) {
    return d3.range(value.length).map(function(i) {
        if (value[i] instanceof Array) return getData(value[i], xAxis);
        else {
            if(!xAxis)
              return {x: i,y: parseFloat(value[i])};
            else 
              return {x : parseFloat(xAxis[i]), y: parseFloat(value[i])};
        }
    });
}

function getxMax(data){
    return d3.max(data, function(d) {
        if(d instanceof Array)
           return getxMax(d);
        else return d.x;});
}

function getxMin(data){
    return d3.min(data, function(d) {
        if(d instanceof Array)
           return getxMin(d);
        else return d.x;});
}

function getyMax(data){
    return d3.max(data, function(d) {
        if(d instanceof Array)
          return getyMax(d);
        else return d.y;});
}

function getyMin(data){
    return d3.min(data, function(d) {
        if(d instanceof Array)
          return getyMin(d);
        else return d.y;});
}

function plot(root,data, size){    
    var margin = {top: 10, right: 10, bottom: 20, left: 40},
    width = size[0] - margin.left - margin.right,
    height = size[1] - margin.top - margin.bottom,
    color = d3.scale.category20(),
    xMax = getxMax(data),   
    yMax = getyMax(data), 
    xMin = getxMin(data),
    yMin=  getyMin(data);
    
var x = d3.scale.linear()
    .domain([xMin, xMax])
    .range([0, width]);

var y = d3.scale.linear()
    .domain([yMin, yMax])
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

var line = d3.svg.line()
    .x(function(d) {return x(d.x);})
    .y(function(d) {return y(d.y);});
        
var svg = root
    .datum(data)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

svg.append("g")
    .attr("class", "y axis")
    .call(yAxis); 

svg.selectAll(".line")
    .data(data) 
    .enter()
    .append("path")
    .attr("class", "line")
    .attr("d", line)
    .style("stroke-width", 2) 
    .style("fill", 'none') 
    .style("stroke",  function(d, i) {return color(i);}); 
    
var svg2 = svg.selectAll(".dot");
for(var j=0; j < data.length; j++){
svg2.data(data[j])
    .enter().append("circle")
    .attr("class", "dot")
    .attr("cx", line.x())
    .attr("cy", line.y())
    .attr("r", 3.5)
    .append("svg:title").text(
        function(d){return "time step: "+d.x + "\n"+ "value: " +d.y;})
    }
}

function tabulate(processeddata, root){  
    root.append("table")
      .style("border-collapse", "collapse")
      .style("border", "2px black solid")
      .selectAll("tr")
      .data(processeddata)
      .enter()
      .append("tr")
      .selectAll("td")
      .data (function(row) {
         return row;})
      .enter()
      .append("td")
      .style("border", "1px black solid")
      .style("padding", "10px")
      .on("mouseover", function(){d3.select(this).style("background-color", "aliceblue")}) 
      .on("mouseout", function(){d3.select(this).style("background-color", "white")}) 
      .text(function(d){return d;})
      .style("font-size", "12px");
}