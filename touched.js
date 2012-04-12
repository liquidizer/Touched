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
    var start= bodyArea();
    canvas.append(start);
    select(start.find('.arg'));
    updateAll();
}

function updateAll() {
    updateTypes();
    updateMenu();
}

function elementArea(tmp) {
    if (!tmp) tmp= $('<div class="box"/>');
    tmp.attr('onmousedown','msDown(evt)');
    return tmp;
}

function bodyArea() {
    var div= $('<div class="box-body"/>');
    div.append(dropArea());
    return div;
}

function dropArea() {
    var tmp= $('<div class="box arg">?</div>');
    tmp.attr('onmousedown','msDown(evt)');
    return tmp;
}

function select(obj) {
    unselectAll();
    obj.addClass('selected');
}

function unselectAll() {
    $('.selected').removeClass('selected');
}

function selectNext(obj) {
    var isup = false;
    while (obj.attr('id') != 'canvas') {
        if (!isup && obj.children(':first').length > 0) {
            obj = obj.children(':first');
        }
        else {
            if (obj.next().length > 0) {
                isup = false;
                obj = obj.next();
            }
            else {
                isup = true;
                obj = obj.parent();
            }
        }
        if (obj.hasClass('arg')) {
            select(obj);
            return;
        }
    }
    unselectAll();
}


// msDown is called whenever the mouse button is pressed anywhere on the root document.
function msDown (evt) {
    evt.preventDefault();
    if (hand==null && evt.target!=null) {
        // find signaling object
        var grabbed= $(evt.target);
    	while (!grabbed.hasClass('box')) {
            if (grabbed.attr('id')=='canvas') return;
	        grabbed= grabbed.parent();
	    }
	    hand= grabbed;
        unselect= hand.hasClass('selected');
        select(hand);
        updateMenu();

	    // store mouse position. Will be updated when mouse moves.
        startPos= [evt.clientX, evt.clientY];

        hasMoved= false;
        return false;
    }
}

function msMove(evt) {
    evt.preventDefault();
    if (hand) {
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
                    $('canvas').append(hand);
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

