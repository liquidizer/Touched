var code= '<touched:code>';
var file= '<touched:file>';
var viewsplit= undefined;
$(function() {
    initTouched('canvas','menu','<touched:g>', $('#code > div')[0], !!code);
    $('#canvas').bind('update', function() { saveContent(); runContent(); });
    $('#autoupdate').bind('change', runContent);
    $('#execControl').bind('mousedown', viewDown);
    $('#execControl').attr('ontouchstart', 'viewDown(event)');
    $('#execControl').attr('ontouchmove', 'viewMove(event)');
    $('#execControl').attr('ontouchend', 'viewUp(event)');
    if (!code) {
	$('#execControl').append('<input type="button" id="EDIT" value="EDIT"/>');
	$('#EDIT').click(function() { window.location= '/'+file+'?edit'; });
    }
    setViewSplit($('body').width()/2);
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
    viewsplit= $('#execution').offset().left - evt.clientX;
    evt.preventDefault();
    $('body').bind('mousemove', viewMove);
    $('body').bind('mouseup', viewUp);
}

function setViewSplit(left) {
    $('#execution').offset({ left : left });
    $('#execution').width($('body').width()-left);
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
    clearErrors();
    if ($('#autoupdate').attr('checked')) {     	        	    
        $('#dataview').show();
	execute('canvas', 'dataview');
    } else {
	//$('#dataview').hide();
	$('#dataview').empty(); 
	codestring = "";
    }
}
