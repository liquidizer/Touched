$(init);
function init() {
    var start= bodyArea();
    $('#canvas').append(start);
    select(start);
    updateAll();
}

function updateAll() {
    updateTypes();
    updateMenu();
}

function elementArea(tmp) {
    if (!tmp) tmp= $('<div class="box"/>');
    tmp.draggable({
	    start: handleDragStartEvent,
		distance: 20
    });
    tmp.click(handleSelectionEvent);
    return tmp;
}

function bodyArea() {
    tmp= dropArea();
    tmp.addClass('cmd');
    return tmp;
}

function dropArea() {
    var tmp= $('<div class="box arg">?</div>');
    tmp.droppable({
	    drop: handleDropEvent
    });
    tmp.click(handleSelectionEvent);
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

function handleSelectionEvent(event) {
    var target= $(event.target);
    while(!target.hasClass('box'))
	    target= target.parent();
    if (target.hasClass('selected')) {
	    target.removeClass('selected');
	} else {
        select(target);
    }
    updateMenu();
    return false;
}

function handleDragStartEvent(event) {
    var target= $(event.target);
    if (! target.hasClass('float')) {
	if (target.attr('data-type')=='ident') {
	    var clone= target.clone();
	    clone.removeClass('selected');
	    target.before(elementArea(clone));
	} else {
	    target.before(dropArea());
	}
	target.addClass('float');
	$('#canvas').append(target);
	updateAll();
    }
}

function handleDropEvent(event, ui) {
    ui.draggable.removeClass('float');
    ui.draggable.css("left","0px"); 
    ui.draggable.css("top","0px"); 
    $(event.target).replaceWith(ui.draggable);
    updateAll();
}