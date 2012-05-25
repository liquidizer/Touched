function getPlot() {
    $('#testChoice').hide();
    $('#rund3').hide();
    $("#canvas").append("<div id ='dataview'/>");
    var root = $('#canvas').children();
    var x = extractInfo(root);
    console.log("x is :");
    console.log(x); 
    d3.json("v.json", function(jsondata) {
        plotData(d3.select("#dataview"), jsondata);
    });
}

var getKeys = function(obj) {
        var keys = [];
        if (obj instanceof Object) for (var key in obj) {
            keys.push(key);
        }
        return keys;
    };
    
function plotData(root, data) {   
    root.data(getKeys(data))
        .each(function(d) {
        console.log(d);
        console.log(data);
        if ((data[d] instanceof Array) && d=="value") 
           plot(getData(data[d]));
        else if(!(data[d] instanceof Array))
           plotData(root, data[d]);
    })
}

function getData(value) { 
 return d3.range(value.length).map(function(i) {
     if(value[i] instanceof Array)
        return getData(value[i]);
     else
        return {x: i, y: value[i]};
    });
}

function getxMax(data){
    return d3.max(data, function(d) {
        if(d instanceof Array)
           return getxMax(d);
        else return d.x;});
}

function getyMax(data){
    return d3.max(data, function(d) {
        if(d instanceof Array)
          return getyMax(d);
        else return d.y;});
}

function plot(data){
    if(!d3.select("#dataview").select("svg").empty())
       d3.select("#dataview").select("svg").remove();       
    var margin = {top: 10, right: 10, bottom: 20, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    color = d3.scale.category20(),
    xMax = getxMax(data),   
    yMax = getyMax(data); 
    
var x = d3.scale.linear()
    .domain([0, xMax])
    .range([0, width]);

var y = d3.scale.linear()
    .domain([0, yMax])
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
        
var svg = d3.select("#dataview")
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

if (data[0] instanceof Array)
 var svg2= svg.selectAll(".line")
    .data(data) 
    .enter();
else 
  var svg2= svg;
  
  svg2.append("path")
    .attr("class", "line")
    .attr("d", line)
    .style("stroke-width", 2) 
    .style("fill", 'none') 
    .style("stroke",  function(d, i) {return color(i);}); 

var svg3 = svg.selectAll(".dot");
if(data[0] instanceof Array){
for(var j=0; j < data.length; j++){
svg3.data(data[j])
    .enter().append("circle")
    .attr("class", "dot")
    .attr("cx", line.x())
    .attr("cy", line.y())
    .attr("r", 3.5)
    .append("svg:title").text(
        function(d){return "time step: "+d.x + "\n"+ "value: " +d.y;})
        }
}
else{
svg3.data(data)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("cx", line.x())
    .attr("cy", line.y())
    .attr("r", 3.5) 
    .append("svg:title").text(
        function(d){return "model time: "+ d.y;})
    }
}