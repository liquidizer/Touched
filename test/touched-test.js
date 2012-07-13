$(init);
function init() {
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
}

function loadGrammar(grammar) {
    loadGrammarFile(grammar);
}

function runTest(name) {
    clear_clipboard();
    $('#testChoice').hide();
    var data= $('tests test[name="'+name+'"]');
    var testData = $(data).text();
    var array = testData.split("\n").filter(function (x) { return x; });
    stepThroughTest(array, 0);
}

function stepThroughTest(array) {
    if (array.length>0) {
        var res = eval("(" + array.shift() + ")");
        var e = jQuery.Event("keydown");
        e.keyCode = res.keyCode;
        e.which = res.keyCode;
        e.ctrlKey = res.isCtrl;
        e.shiftKey = res.isShift;
        if (res.target == '#input') {
	    var oldvalue = $('#input').val() || '';
	    if (res.keyCode == 8) {
                $('#input').val(oldvalue.replace(/.$/,''));
	    }
	    else if(res.keyCode == 190)
                $('#input').attr('value', oldvalue+'.'); 
	    else if (res.keyCode!=13) {
                var newvalue = String.fromCharCode(res.keyCode);
                if (!e.shiftKey) newvalue = newvalue.toLowerCase();
                $('#input').val(oldvalue + newvalue);
	    }
        }
        $(res.target).trigger(e);
	var stepNext= function() { stepThroughTest(array); };
        if (res.target != '#input') 
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
        var target= evt.target.nodeName;
        if ($(evt.target).attr('id'))
            target= '#'+$(evt.target).attr('id');
        var eventStr= '{target:"'+target+'", keyCode:'+evt.which+', isCtrl:'+evt.ctrlKey+', isShift:'+evt.shiftKey+'}<br/>';
        record= record+eventStr;
    });
    $('#STOP').parent().show();
    $('#STOP').click(function() {
        document.write(record);
    });
}

