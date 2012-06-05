function getPlot() {
    $('#testChoice').hide();
    $("#canvas").append("<div id ='dataview'/>");
    var root = $('#canvas').children();
    
    var filename = getFilename(root);
    //console.log(filename);
    //get data
    
    d3.text(filename, function(data){
        var parsedCSV = d3.csv.parseRows(data);
        console.log(parsedCSV);     
        var cmdList = extractCommands(root);
        //console.log(cmdList);    
        process(cmdList, parsedCSV, function(processedData) {
            // all data is loaded and processed....
            //console.log('back');
            console.log(processedData);
            plotData(d3.select("#dataview"), processedData);
        });
    });
}

function process(cmdList, parsedCSV, callback) {
    if (cmdList.length==0) {
        callback(parsedCSV);
        return;
    }
    var command = cmdList.shift();    
    if (command[0] == 'd3.data.keeprow') {
        if (command.length == 3) parsedCSV = parsedCSV.slice(command[1] - 1, command[2]);
        else if (command.length == 2) parsedCSV = parsedCSV.slice(command[1] - 1,command[1]);
    }
    else if (command[0] == 'd3.data.keepcolumn') {   
        for (var i = 0; i < parsedCSV.length; i++) {
            if (command.length == 3) parsedCSV[i] = parsedCSV[i].slice(command[1] - 1, command[2]);
            if (command.length == 2) parsedCSV[i] = parsedCSV[i].slice(command[1] - 1, command[1]);
        }
    }
    else if (command[0] == 'd3.data.transpose') {
        var w = parsedCSV.length,
            h = parsedCSV[0].length;
        var i, j, t = [];
        for (i = 0; i < h; i++) {
            // Insert a new row (array)
            t[i] = [];
            // Loop through every item per item in outer array (width)
            for (j = 0; j < w; j++) {
                // Save transposed data.
                t[i][j] = parsedCSV[j][i];
            }
        }
        parsedCSV = t;
    }
    else if(command[0] == 'd3.data.removerow'){
        if (command.length == 3) parsedCSV.splice(command[1] - 1, command[2] - command[1] + 1);        
        else if (command.length == 2) parsedCSV.splice(command[1] - 1, 1);
    }
    else if (command[0] == 'd3.data.removecolumn') {
        for (var i = 0; i < parsedCSV.length; i++) {
            if (command.length == 3) parsedCSV[i].splice(command[1] - 1, command[2] - command[1] + 1);
            if (command.length == 2) parsedCSV[i].splice(command[1] - 1, 1);
        }
    }
    process(cmdList, parsedCSV, callback);
}

function getFilename(node){
     var ele = $(node);
     var name = $(ele).attr('data-name');
     if (name == 'filename') return ele.text();    
     else {
         var filename
         ele.children().each(function(index, child) {
             filename = filename || getFilename(child);
         });
         return filename;
     }
     return undefined;
}

function extractCommands(node) {
    var list=[];
    var ele = $(node);
    var type = $(ele).attr('data-type');
    //console.log(type);
    if(type == 'd3.data.keeprow' || type == 'd3.data.keepcolumn' || type =='d3.data.removerow' || type == 'd3.data.removecolumn'){
        var rangeele = $(ele).find('[data-type= range]');
        if (rangeele.length != 0) {
            var start = extractCommands($(rangeele).find('[data-name= start]'));
            var end = extractCommands($(rangeele).find('[data-name= end]'));
            var partiallist = [];
            partiallist.push(type);
            partiallist.push(start[0]);
            partiallist.push(end[0]);
            list.push(partiallist);
        }
        else{
            var num = extractCommands($(ele).find('[data-type= number]'));
            var partiallist = [];
            partiallist.push(type);           
            partiallist.push(num[0]);
            list.push(partiallist);
        }
    }
    else if(type == 'd3.data.transpose'){
            var partiallist = [];
            partiallist.push(type);
            list.push(partiallist);
    }
    /*
    if(type=='range'){
        var start= extractCommands($(ele).find('[data-name= start]'));
        var end= extractCommands($(ele).find('[data-name= end]'));      
        var partiallist = [];
        partiallist.push(start[0]);
        partiallist.push(end[0]);
        list.push(partiallist);
    }*/
    else if(type=='number'){
        list= [parseFloat(ele.text())];
    }
    else {
        ele.children().each(function(index, child) {
            list= list.concat(extractCommands($(child)));
            //console.log(data);
        });
    } 
    return list;   
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