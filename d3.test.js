function getPlot() {
    $('#testChoice').hide();
    $("#canvas").append("<div id ='dataview'/>");
    var root = $('#canvas').children();
    if (!d3.select("#dataview").select("table").empty()) d3.select("#dataview").selectAll("table").remove();
    if (!d3.select("#dataview").select("svg").empty()) d3.select("#dataview").selectAll("svg").remove();
    var filename = getFilename(root);
    //console.log(filename);
    //get data  
    d3.text(filename, function(data){
        var parsedCSV = d3.csv.parseRows(data);
        //console.log(parsedCSV); 
        
        //console.log(root);
        var element = root.find('[data-type= "d3.cmd"]');
        //console.log(element);        
        for (var i = 0; i < element.length; i++) {
            var result = {
                data: parsedCSV,
                size: [300, 200],
                plotOption: ""
            };
            //console.log(element[i]);
            var cmdList = extractCommands(element[i]);
            
            //console.log(cmdList);    
            process(cmdList, result, function(processedData) {
                // all data is loaded and processed....
                //console.log('back');
                //console.log(processedData.data);
                //console.log(processedData.plotOption);
                if(processedData.plotOption=='d3.cmd.plot.line')
                plotData(d3.select("#dataview"), processedData.data, processedData.size);
                if(processedData.plotOption=='d3.cmd.plot.table')
                tabulate(d3.select("#dataview"), processedData.data);
            });
        }
    });
}

function process(cmdList, result, callback) {
    if (cmdList.length==0) {
        callback(result);
        return;
    }
    var command = cmdList.shift();    
    if (command[0] == 'd3.filter.keeprow') {
        if (command.length == 3) result.data = result.data.slice(command[1] - 1, command[2]);
        else if (command.length == 2) result.data = result.data.slice(command[1] - 1,command[1]);
    }
    else if (command[0] == 'd3.filter.keepcolumn') {   
        for (var i = 0; i < result.data.length; i++) {
            if (command.length == 3) result.data[i] = result.data[i].slice(command[1] - 1, command[2]);
            if (command.length == 2) result.data[i] = result.data[i].slice(command[1] - 1, command[1]);
        }
    }
    else if (command[0] == 'd3.filter.transpose') {
        var w = result.data.length,
            h = result.data[0].length;
        var i, j, t = [];
        for (i = 0; i < h; i++) {
            // Insert a new row (array)
            t[i] = [];
            // Loop through every item per item in outer array (width)
            for (j = 0; j < w; j++) {
                // Save transposed data.
                t[i][j] = result.data[j][i];
            }
        }
        result.data = t;
    }
    else if(command[0] == 'd3.filter.removerow'){
        if (command.length == 3) result.data.splice(command[1] - 1, command[2] - command[1] + 1);        
        else if (command.length == 2) result.data.splice(command[1] - 1, 1);
    }
    else if (command[0] == 'd3.filter.removecolumn') {
        for (var i = 0; i < result.data.length; i++) {
            if (command.length == 3) result.data[i].splice(command[1] - 1, command[2] - command[1] + 1);
            if (command.length == 2) result.data[i].splice(command[1] - 1, 1);
        }
    }
    else if(command[0] == 'd3.plot-option.size'){
        result.size[0] = command[1];
        result.size[1] = command[2];
    }
    else if(command[0] == 'd3.cmd.plot.line' || command[0]=='d3.cmd.plot.table'){
        result.plotOption = command[0];
    }
    process(cmdList, result, callback);
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

function extractCommands(element) {
    var resList=[];
    var ele = $(element);
    var type = $(ele).attr('data-type');
    if(type == 'd3.cmd.plot.line' || type=='d3.cmd.plot.table'){
         resList = extractFilters(ele);
         var partiallist = [];
         partiallist.push(type);
         resList.push(partiallist);
         //return resList;
    }
    else {
        ele.children().each(function(index, child) {
            resList=resList.concat(extractCommands($(child)));
            //console.log(data);
        });
    }
    return resList;
}

function extractFilters(node) {
    var list=[];
    var ele = $(node);
    var type = $(ele).attr('data-type');
    //if(type) console.log(type);
    if(type == 'd3.filter.keeprow' || type == 'd3.filter.keepcolumn' || type =='d3.filter.removerow' || type == 'd3.filter.removecolumn'){
        var rangeele = $(ele).find('[data-type= range]');
        if (rangeele.length != 0) {
            var start = extractFilters($(rangeele).find('[data-name= "start"]'));
            var end = extractFilters($(rangeele).find('[data-name= "end"]'));
            var partiallist = [];
            partiallist.push(type);
            partiallist.push(start[0]);
            partiallist.push(end[0]);
            list.push(partiallist);
        }
        else{
            var num = extractFilters($(ele).find('[data-type= "number"]'));
            var partiallist = [];
            partiallist.push(type);           
            partiallist.push(num[0]);
            list.push(partiallist);
        }
    }
    else if(type == 'd3.filter.transpose'){
            var partiallist = [];
            partiallist.push(type);
            list.push(partiallist);
    }
    else if(type=='number'){
        list= [parseFloat(ele.text())];
    }
    else if(type == 'd3.plot-option.size'){
        var width = extractFilters($(ele).find('[data-name = "width"]'));
        var height = extractFilters($(ele).find('[data-name = "height"]'));
        var partiallist = [];
        partiallist.push(type);
        partiallist.push(width[0]);
        partiallist.push(height[0]);
        list.push(partiallist);
    }
    else {
        ele.children().each(function(index, child) {
            list= list.concat(extractFilters($(child)));
            //console.log(data);
        });
    } 
    return list;   
}

function plotData(root, data, size) {   
    plot(root,getData(data), size);
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

function plot(root,data, size){    
    var margin = {top: 10, right: 10, bottom: 20, left: 40},
    width = size[0] - margin.left - margin.right,
    height = size[1] - margin.top - margin.bottom,
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

function tabulate(root,data){
    //console.log(data);   
    root.append("table")
      .style("border-collapse", "collapse")
      .style("border", "2px black solid")
      .selectAll("tr")
      .data(data)
      .enter()
      .append("tr")
      .selectAll("td")
      .data (function(row) {
         //console.log(row);
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