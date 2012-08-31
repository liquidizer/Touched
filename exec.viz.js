// implement the viz grammar
commands.viz = {
	script : function(code, output) {
		output.selectAll('*').remove();
		code.args('command').forEach(function(cmd) {
			var root = output.append('div');
			cmd.call(root, function(data) {
				data.toDOM(root);
			});
		});
	},
	cmd : {
		data : function(code, output, callback) {
			var url = code.arg('src').text;
			if(url) {
				if(url.match(/[a-z]+:\/\//))
					url = "/redirect/" + encodeURI(url);
				d3.text(url, function(data) {
					if(!data)
						code.arg('src').error("Could not read file");
					else {
						data = VizData.text(data);
						code.fold('filter', data, callback);
					}
				});
			}
		}
	},
	filter : {
		text : {
			replace : function(code, data, callback) {
				var regex = code.arg('regex').text;
				var value = code.arg('to').text || '?';
				if(regex) {
					var reg = new RegExp(regex, "g");
					data.text = data.text.split('\n').map(function(x) {
						return x.replace(reg, value);
					}).join('\n');
					//data.text = data.text.replace(new RegExp(regex, "g"), value);
				}
				callback(data);
			},
			csv : function(code, data, callback) {
				var csv = d3.csv.parseRows(data.text);
				data = VizData.matrix(csv);
				code.fold('filter', data, callback);
			},
			json : function(code, data, callback) {
				var parsedjson = eval('(' + data.text + ')');
				data = VizData.json(parsedjson);
				code.fold('filter', data, callback);
			},
			match : function(code, data, callback) {
				var lines = getRange(code.arg('lines'));
				if(lines) {
					var lineArray = data.text.split('\n');
					data.text = lineArray.filter(function(d, i) {
						if(lines.contains(i + 1)) {
							var subData = new VizData.text(lineArray[i]);
							code.fold('filter', subData, function(d) {
								lineArray[i] = d.text;
							});
						}
					});
					data.text=lineArray.join('\n');
					callback(data);
				}
			}
		},
		matrix : {
			transpose : function(code, data, callback) {
				data.matrix = transpose(data.matrix);
				callback(data)
			},
			sort : function(code, data, callback) {
				var column = code.arg('column').text;
				if(column) {
					column = parseInt(column);
					data.matrix.sort(function(a, b) {
						return a[column - 1] - b[column - 1];
					});
				}
				callback(data);
			},
			rmcols : function(code, data, callback) {
				var range = getRange(code.arg('cols'));
				if(range) {
					data.matrix = data.matrix.map(function(row, i) {
						return row.filter(function(ele, i) {
							return !range.contains(i + 1);
						});
					});
				}
				callback(data);
			},
			selcols : function(code, data, callback) {
				var range = getRange(code.arg('cols'));
				if(range) {
					data.matrix = data.matrix.map(function(row, i) {
						return row.filter(function(ele, i) {
							return range.contains(i + 1);
						});
					});
				}
				callback(data);
			},
			rmrows : function(code, data, callback) {
				var range = getRange(code.arg('rows'));
				if(range) {
					data.matrix = data.matrix.filter(function(ele, i) {
						//console.log((i + 1) + ' -> ' + !range.contains(i + 1));
						return !range.contains(i + 1);
					});
				}
				callback(data);
			},
			selrows : function(code, data, callback) {
				var range = getRange(code.arg('rows'));
				if(range) {
					data.matrix = data.matrix.filter(function(ele, i) {
						//console.log((i + 1) + ' -> ' + !range.contains(i + 1));
						return range.contains(i + 1);
					});
				}
				callback(data);
			},
			selectcolumnbyvalue : function(code, data, callback) {
				var rownumber = parseFloat(code.arg('rownumber').text);
				var range = getRange(code.arg('value'));
				if(range && rownumber) {
					data.matrix = transpose(data.matrix);
					data.matrix = data.matrix.filter(function(ele, index) {
						return range.contains(ele[rownumber - 1]);
					});
					data.matrix = transpose(data.matrix);
				}
				callback(data);
			},
			removecolumnbyvalue : function(code, data, callback) {
				var rownumber = parseFloat(code.arg('rownumber').text);
				var range = getRange(code.arg('value'));
				if(range && rownumber) {
					data.matrix = transpose(data.matrix);
					data.matrix = data.matrix.filter(function(ele, index) {
						return !range.contains(ele[rownumber - 1]);
					});
					data.matrix = transpose(data.matrix);
				}
				callback(data);
			},
			lineplot : function(code, data, callback) {
				data = VizData.lineplot(data.matrix);
				code.fold('option', data, callback);
			}
		},
		json : {
			subfield : function(code, data, callback) {
				var fieldname = code.arg('fieldname').text;
				if(fieldname)
					data.json = data.json[fieldname];
				callback(data);
			},
			elt : function(code, data, callback) {
				var index = code.arg('index').text;
				if(index)
					data.json = data.json[index];
				callback(data);
			},
			tomatrix : function(code, data, callback) {
				data = VizData.matrix(data.json);
				code.fold('filter', data, callback);
			}
		}
	},
	plotoption : {
		size : function(code, data, callback) {
			var width = parseFloat(code.arg('width').text);
			if(width)
				data.options.size[0] = width;
			var height = parseFloat(code.arg('height').text);
			if(height)
				data.options.size[1] = height;
			callback(data);
		},
		xaxis : function(code, data, callback) {
			var colnum = code.arg('column').text;
			if(colnum) {
				data.options.xaxis = data.matrix[colnum - 1];
				data.matrix.splice(colnum - 1, 1);
			}
			callback(data);
		},
		timexaxis : function(code, data, callback) {
			if(!data.options.xaxis) {
				code.error('no xaxis defined')
			} else {
				var format = code.arg('format').text;
				if(format) {
					data.options.timexaxis = format;
				}
			}
			callback(data);
		},
		circle : function(code, data, callback) {
			var circlesize = code.arg('circlesize').text;
			if(circlesize)
				data.options.circlesize = circlesize;
			callback(data);
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
				output.append("table").selectAll("tr").data(this.matrix).enter().append("tr").selectAll("td").data(function(row) {
					return row;
				}).enter().append("td").text(function(d) {
					return d;
				})
			}
		}
	},
	json : function(data) {
		return {
			json : data,
			toDOM : function(output) {
				plotJSON(output.append('ul'), this.json);
			}
		}
	},
	lineplot : function(matrix) {
		return {
			matrix : matrix,
			options : {
				size : [300, 200],
				xaxis : undefined,
				timexaxis : undefined,
				circlesize : 3.5
			},
			toDOM : function(output) {
				plot(output, getData(this.matrix, this.options.xaxis, this.options.timexaxis), this.options.size, this.options.timexaxis, this.options.circlesize);
			}
		}
	}
}

function plotJSON(output, data) {
	output.selectAll("li").data(getKeys(data)).enter().append('li').append('span').text(function(d) {
		if(data[d] instanceof Object)
			return d;
		else
			return d + " : " + data[d].toString();
	}).on("click", function(d) {
		var parent = d3.select(this.parentNode)
		if(parent.select("ul").empty()) {
			plotJSON(parent.append("ul"), data[d]);
		} else
			parent.select("ul").remove();
	});
}

function getKeys(obj) {
	var keys = [];
	if( obj instanceof Object)
		for(var key in obj) {
			keys.push(key);
		}
	return keys;
};