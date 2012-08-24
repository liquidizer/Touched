var viewsplit= undefined;
var codeleft= true;
var split= 300;
$(function() {
    initTouched('canvas','menu',grammar, $('#code > div'), !!code);
    $('#canvas').bind('update', function() { saveContent(); runContent(); });
    $('#autoupdate').bind('change', runContent);
    $('#debugmode').bind('change', runContent);
    $('#codeleft').bind('change', switchView);
    $('#execControl').bind('mousedown', viewDown);
    $('#execControl').attr('ontouchstart', 'viewDown(event)');
    $('#execControl').attr('ontouchmove', 'viewMove(event)');
    $('#execControl').attr('ontouchend', 'viewUp(event)');
    if (!code) {
	$('#execControl').append('<input type="button" id="EDIT" value="EDIT"/>');
	$('#EDIT').click(function() { window.location= '/'+file+'?edit'; });
    }
    setViewSplit($('body').width()/2);
    runContent();
});
function viewUp(evt) {
    $('body').unbind('mousemove', viewMove);
    $('body').unbind('mouseup', viewUp);
}
function viewMove(evt) {
    evt.preventDefault();
    evt= translateTouch(evt);
    setViewSplit(viewsplit+evt.clientX);
}
function viewDown(evt) {
    evt= translateTouch(evt);
    viewsplit= split - evt.clientX;
    evt.preventDefault();
    $('body').bind('mousemove', viewMove);
    $('body').bind('mouseup', viewUp);
}

function setViewSplit(x) {
    split= x;
    var targets= codeleft ? ['#canvas','#execution'] : ['#execution','#canvas'];
    $(targets[0]).offset({ left : 5 });
    $(targets[0]).width(x - 5);
    $(targets[1]).offset({ left : x+5 });
    $(targets[1]).width($('body').width()-x-20);
    $('#execsetting').hide();
}

function switchView() {
    codeleft= $('#codeleft').attr('checked');
    setViewSplit(split);
}

function saveContent() {
    if (code!='_play_') {
        var content = $('#canvas').html();
        var http = new XMLHttpRequest();
        http.onreadystatechange = function() { 
            if (http.readyState==4 && http.status!=200) 
                $('#menu').html('<b>Error saving document</b>');
        };
        http.open("POST", '/'+file+'?save&code='+code, true);
        http.send(content);
    }
}

var debugQueue;
var debugDisabled;

function debugNext(stepInto) {
    if (debugQueue.length==1)
	$('#debugControl').hide();
    var next= debugQueue.shift();
    next[1]();
    if (debugQueue.length>0)
	select(debugQueue[0][0]);
}

function debugContinue() {
    debugDisabled= true;
    while (debugQueue[0]) {
	if (!debugDisabled) return;
	debugQueue.shift()[1]();
    }
    $('#debugControl').hide();
}

function initDebug(active) {
    debugQueue= [];
    debugDisabled= false;
    $('#debugControl').hide();
    if (active) {
	commands._debug= function(code, next) {
	    var elem= $('#'+code.id);
	    if (debugDisabled && elem.is('.selected')) {
		debugContinue();
		debugDisabled= false;
	    }
	    if (debugDisabled) {
		next();
	    } else {
		$('#debugControl').show();
		if (debugQueue.length==0)
		    select(elem);
		debugQueue.push([elem, next]);
	    }
	}
    } else {
	commands._debug= undefined;
    }
}

function runContent() {
    $('#execsetting').hide();
    if ($('#autoupdate').attr('checked')) {
        $('#dataview').show();
	initDebug($('#debugmode').attr('checked'));
	var recalc= execute('canvas', 'dataview');
	if (recalc) clearErrors();
    } else {
	$('#dataview').empty();
	codestring = "";
	clearErrors();
    }
}
