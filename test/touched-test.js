$(init);
function init() {

    // build the test case list
    $('tests test').each(function(index, data){
        var name = $(data).attr('name');
	var grammar= $(data).attr('grammar');
	var group= $("#tests li").filter(function() { return $(this).attr('g')==grammar; });
	if (group.length==0) {
	    group= $("<li g='"+grammar+"'/>");
	    group.append("<a href='#' onclick='loadGrammar(\"../"+grammar+"\")'>load "+grammar+"</a></li>");
	    group.append('<ul/>');
	    $("#tests").append(group);
	}
        group.find('ul').append("<li><input type='button' onclick='runTest(\""+name+"\")' value='run "+name+"' /></li>");
    });

    // initialize the touched editor
    initTouched('canvas','menu');

    // connect execution listeners
    $('#canvas').bind('update', updateView);
    $('#autoupdate').bind('change',updateView);
    $('#showtests').bind('change', function() {
        if ($('#showtests').attr('checked'))
            $('#testChoice').show();
        else
            $('#testChoice').hide();
    });
}

// call this function whenever the model changes
function updateView() {
    if ($('.element').length>0) {
        $('#showtests').attr('checked',false);
        $('#testChoice').hide();
        if ($('#autoupdate').attr('checked')) {
            clearErrors();
            execute('canvas','dataview');
        }
    }
}

function loadGrammar(grammar) {
    loadGrammarFile(grammar);
}

function runTest(name) {
    clear_clipboard();
    select($('.arg.box:first'));
    $('#testChoice').hide();
    updateAll();
    var data= $('tests test[name="'+name+'"]');
    var testData = $(data).text();
    var array = testData.split("\n").filter(function (x) { return x; });
    stepThroughTest(array, 0);
}



function stepThroughTest(array) {
	if(array.length > 0) {
		var res = eval("(" + array.shift() + ")");
		var e = jQuery.Event("keydown");
		e.keyCode = res.keyCode;
		e.which = res.keyCode;
		e.ctrlKey = res.isCtrl;
		e.shiftKey = res.isShift;
		var input = $('#input');
		//var inputvalue = $('#input').attr('value');
		if(res.target == '#input') {
			if(res.value !== undefined) {// new style
				//$('#input').attr('value', res.value);	
				$('#input').val(res.value);		
			} else {// old style
				// TODO restore old code
				var oldvalue = $('#input').val() || '';
				if(res.keyCode == 8) {
					$('#input').val(oldvalue.replace(/.$/, ''));
				} else if(res.keyCode == 190)
					$('#input').attr('value', oldvalue + '.');
				else if(res.keyCode != 13) {					
					var newvalue = String.fromCharCode(res.keyCode);
					if(!e.shiftKey)
						newvalue = newvalue.toLowerCase();
					$('#input').val(oldvalue + newvalue);
				}
			}
		}
		//inputvalue = $('#input').attr('value');
		$(res.target).trigger(e);
		//inputvalue = $('#input').attr('value');
		var stepNext = function() {
			stepThroughTest(array);
		};
		if(res.target != '#input')
			setTimeout(stepNext, 200);
		else
			setTimeout(stepNext, 20);
	}
}



var record;
function recordTest() {
    record="";
    $('#testChoice').hide();
    $('#rund3').hide();
    $('body').keydown(function(evt) {
    	var eventStr;
        if ($(evt.target).is('input')) {
            eventStr= '{target: "#input", value: "'+$('input').val() + '"}';
    		if(evt.which ==13 || evt.which==9)
    		    eventStr= eventStr+'<br/>{target:"#input", keyCode:'+evt.which+'}';
        } else {
            var target= evt.target.nodeName;
            if ($(evt.target).attr('id'))
                target= '#'+$(evt.target).attr('id');
            eventStr= '{target:"'+target+'", keyCode:'+evt.which+', isCtrl:'+evt.ctrlKey+', isShift:'+evt.shiftKey+'}';
        }
        if(eventStr)
        record= record+eventStr+'<br/>';
    });
    $('#STOP').parent().show();
    $('#STOP').click(function() {
        document.write(record);
    });
}

