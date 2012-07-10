// implement the viz grammar
commands.viz= {
    script : function(code, output) {
	output.selectAll('*').remove();
	code.args('command').each( function (i, cmd) {
		var root= output.append('div');
		cmd.call(root, function(data) {
			data.toDOM(root);
		    });
	    });
    },
    cmd : {
	data : function(code, output, callback) {
	    var url= code.arg('src').text;
	    if (url) {
		if (url.match(/[a-z]+:\/\//)) url= "/redirect/"+encodeURI(url);
		d3.text(url, function(data) {
		    if (!data) code.arg('src').error("Could not read file");
		    else {
			data= VizData.text(data);
			code.fold('filter', data, callback);
		    }
		});
	    }
	}
    },
    filter : {
	text : {
	    replace : function(code, data, callback) {
		var regex= code.arg('regex').text;
		var value= code.arg('to').text || '?';
		if (regex) {
		    data.text= 
			data.text.replace(new RegExp(regex,"g"), value);
		}
		callback(data);
	    },
	    csv : function(code, data, callback) {
		var csv= d3.csv.parseRows(data.text);
		data= VizData.matrix(csv);
		code.fold('filter', data, callback);
	    }
	},
	matrix : {
	    transpose : function(code, data, callback) {
		data.matrix= transpose(data.matrix);
		callback(data)
	    },
	    sort : function(code, data, callback) {
		var column= code.arg('column').text;
		if (column) {
		    column= parseInt(column);
		    data.matrix
			.sort(function(a,b){return a[column-1]-b[column-1];});
		}
		callback(data);
	    },
	    rmcols : function(code, data, callback) {
		var range= getRange(code.arg('cols'));
		data.matrix= data.matrix.map(function (row, i) {
		    return row.filter (function (ele,i) { return !range.contains(i+1); });
		});
		callback(data);
	    },
	    rmrows : function(code, data, callback) {
		var range= getRange(code.arg('rows'));
		data.matrix= data.matrix.filter (function (ele,i) { return !range.contains(i+1); });
		callback(data);
	    }
	}
    }
};

var VizData = {
    text : function(text) { 
	return {
	    text : text,
	    toDOM : function(output) { 
		output.append('pre').text(this.text); 
	    }
	}
    },
    matrix : function(matrix) {
	return {
	    matrix : matrix,
	    toDOM : function(output) {
		output.append("table")
		.selectAll("tr")
		.data(this.matrix).enter()
		.append("tr")
		.selectAll("td")
		.data (function(row) { return row; }).enter()
		.append("td")
		.text(function(d){ return d; })
	    }
	}
    }
}
