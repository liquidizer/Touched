var filename ="";

function extractInfo(node) {
    //console.log(node);
    var ele = $(node);
    if (ele.hasClass('element')) {
        var element= {};
        ele.children('.arg, .group').each(function(i, child) {
            var name= $(child).attr('data-name');
            element[name]= extractInfo(child);
        });
        return element;
    }
    else if (ele.hasClass('arg')) {
        var child= ele.children();
        if (child.hasClass('element'))
            return extractInfo(child);
        else
            return child.text();
    }
    else if (ele.hasClass('group')) {
        return ele.children('.arg').map(function(index, child) {
            return extractInfo($(child));
        });
    } 
    else {
        console.log("invalid element");
        console.log(node);
    }
}


function getPlot() {
    $('#testChoice').hide();
    $("#canvas").append("<div id ='dataview'/>");
    var root = $('#canvas').children();
    var obj = extractInfo(root);
    //get information from x here:
    //getInfo(obj);
    getInfo(obj.Root);
    d3.json(filename, function(jsondata) {
        plotData(d3.select("#dataview"), jsondata);
    });
}
    
function getInfo(obj) {
    console.log(obj);
    for (var i = 0; i < obj.length; i++) {
        for (var propertyname in obj[i]) {
            console.log(propertyname);
            if (typeof(obj[i][propertyname]) == 'object') getInfo(obj[i][propertyname]);
            else {
                console.log(propertyname + "-> " + obj[i][propertyname]);
                if (propertyname == 'filename') filename = obj[i][propertyname];
            }
        }
    }
}
    
function plotData(root, data) {   
    plot(getData(data));
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
    .enter()
    //.append("circle")
    //.attr("class", "dot")
    .append("rect")
    .attr("class", "cell")
    //.attr("cx", line.x())
    //.attr("cy", line.y())
    //.attr("r", 3.5) 
    .attr("x", line.x())
    .attr("y", line.y())
    .attr("width", 3.5)
    .attr("height", 5)
    .append("svg:title").text(
        function(d){return "value: "+ d.y;})
    }
}