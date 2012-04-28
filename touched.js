// DnD frame work
// hand is a reference to the object currently beeing dragged.
var hand= null;

// The screen coordinates of the last drag update.
var startPos;
var startOffset;
var hasMoved= false;
var unselect= false;

$(init);
function init() {
    var canvas= $('#canvas');
    $('body').mousemove(msMove);
    $('body').mouseup(msUp);
    $('body').mousedown(function(evt) { evt.preventDefault(); });
    $('body').attr('ontouchmove','msMove(event)');
    $('body').attr('ontouchend','msUp(event)');
    $('body').keydown(keyPress);
    var start= bodyArea();
    canvas.append(start);
    select(start.find('.arg'));
    initMenu();
    updateAll();
}

function updateAll() {
    updateTypes();
    updateMenu();
}

function elementArea(tmp) {
    if (!tmp) tmp= $('<div class="box"/>');
    tmp.attr('onmousedown','msDown(event)');
    tmp.attr('ontouchstart','msDown(event)');
    return tmp;
}

function bodyArea() {
    var div= $('<div class="box-body"/>');
    div.append(dropArea());
    return div;
}

function dropArea() {
    var tmp= $('<div class="box arg">?</div>');
    tmp.attr('onmousedown','msDown(event)');
    tmp.attr('ontouchstart','msDown(event)');
    return tmp;
}

function select(obj) {
    unselectAll();
    obj.addClass('selected');
}

function unselectAll() {
    $('.selected').removeClass('selected');
}

function selectNext(obj, reverse) {
    var isup = false;
    while (obj.attr('id') != 'canvas') {
        var childs= reverse ? obj.children(':last') : obj.children(':first');
        if (!isup && !obj.hasClass('float') && childs.length > 0) {
            obj= childs;
        }
        else {
            var next= reverse ? obj.prev() : obj.next();
            if (next.length > 0) {
                isup = false;
                obj= next;
            }
            else {
                isup = true;
                obj = obj.parent();
            }
        }
        if (!isup && obj.hasClass('box')) {
            select(obj);
            return;
        }
    }
    unselectAll();
}


function keyPress(evt) {
    if (evt.which==9 || evt.which==13)
        if (submitMenu) submitMenu();
    if (evt.which==9 || evt.which==13|| evt.which==40) {
        evt.preventDefault();
        var selection= $('.selected');
        if (selection.size()>0)
            selectNext(selection);
        else
            select($('.box:first'));
        updateMenu();
    }
    else if (evt.which==38) {
        evt.preventDefault();
        var selection= $('.selected');
        if (selection.size()>0)
            selectNext(selection, true);
        else
            select($('.box:last'));
        updateMenu();
    }
    else if(evt.which==89) {
        showTypes();
    }
}

// msDown is called whenever the mouse button is pressed anywhere on the root document.
function msDown (event) {
    var evt= translateTouch(event);
    if (hand==null && evt.target!=null) {
        event.preventDefault();
        // find signaling object
        var grabbed= $(evt.target);
    	while (!grabbed.hasClass('box')) {
            if (grabbed.attr('id')=='canvas') return;
	        grabbed= grabbed.parent();
	    }
	    hand= grabbed;
        unselect= hand.hasClass('selected');
        if (!unselect) {
            select(hand);
            updateMenu();
        }
        
	    // store mouse position. Will be updated when mouse moves.
        startPos= [evt.clientX, evt.clientY];

        hasMoved= false;
        return false;
    }
}

function msMove(event) {
    var evt= translateTouch(event);
    if (hand) {
        event.preventDefault();
        var dx= evt.clientX - startPos[0];
        var dy= evt.clientY - startPos[1];
        if (hasMoved || Math.abs(dx)+Math.abs(dy)>20) {
            if (!hasMoved) {
                while (!hand.hasClass('box') || hand.hasClass('arg')) {
                    if (hand.attr('id')=='canvas') return;
                    hand = hand.parent();
                }
                startOffset= hand.offset();
                if (!hand.hasClass('float')) {
                    if (hand.attr('data-type') == 'ident') {
                        var clone = hand.clone();
                        clone.removeClass('selected');
                        hand.before(clone);
                    }
                    else {
                        hand.before(dropArea());
                    }
                    hand.addClass('float');
                    $('#canvas').append(hand);
                    updateAll();
                }
                hand.css('pointer-events','none');
                hasMoved= true;
            }

            if (hasMoved) {
                var arg= $(evt.target);
                if (arg.hasClass('arg') && !arg.parents().is(hand)) {
                    arg.replaceWith(hand);
                    hand.removeClass('float');
                    updateAll();
                    startPos= [evt.clientX, evt.clientY];
                    hasMoved= false;
                    unselect= false;
                }
            }
            if (hasMoved) {
                hand.offset({
                    top: startOffset.top + dy, 
                    left: startOffset.left + dx
                });
            }
        }
    }
}

function msUp (evt) {
    evt.preventDefault();
    if (hand) {
        hand.css('pointer-events', 'all');
        if (unselect && !hasMoved) {
            hand.removeClass('selected');
            updateMenu();
        }
        hand= null;
    }
    return false;
}

// Translate events that come from touch devices
function translateTouch(evt) {
    if (evt.touches!=undefined) {
        var evt2= {};
    	evt2.clientX= evt.touches[0].clientX;
    	evt2.clientY= evt.touches[0].clientY;
    	evt2.target= document.elementFromPoint(evt2.clientX, evt2.clientY);
    	evt2.isTouch= true;
    	return evt2;
    }
    evt.preventDefault();
    return evt;
}

