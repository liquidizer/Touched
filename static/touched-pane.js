var viewsplit= undefined;
var codeleft= true;
var split= 300;
$(function() {
    initTouched('canvas','menu',grammar, $('#code > div')[0], !!code);
    $('#canvas').bind('update', function() { saveContent(); runContent(); });
    $('#autoupdate').bind('change', runContent);
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
function runContent() {
    $('#execsetting').hide();
    clearErrors();
    if ($('#autoupdate').attr('checked')) {     	        	    
        $('#dataview').show();
	execute('canvas', 'dataview');
    } else {
	$('#dataview').empty();
	codestring = "";
    }
}
