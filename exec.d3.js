function processCaption(code, output) {
    output.append('h1').text(code.arg('caption').text);
}

function getRange(code) {
    if (code.type=='number') return {
        contains: function(x) { return x==parseFloat(code.text); }};
    else if(code.type == 'text') return{
        contains: function(x) { return x==code.text; }};
    else if (code.type== 'array.range') {
        return {
            contains: function(x) {
                return x>=parseFloat(code.arg('start').text) &&
                       x<=parseFloat(code.arg('end').text);
            }};
    }
    else if (code.type == 'array.list'){
        return {
        	contains: function(x) {
        		var isContained= false;
		        code.args('element').forEach(function(ele){
		        	isContained = isContained || getRange(ele).contains(x);
	        	});
	        	return isContained;        	
        	}
        };
    }
	else if(!code.type) {
		return {
			contains : function() {
				return false;
			}
		};
	}
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