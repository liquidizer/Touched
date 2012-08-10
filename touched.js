// DnD frame work
// hand is a reference to the object currently being dragged.
var hand= null;

// undo buffer
var undoBuffer= [];
var redoBuffer= [];

// The screen coordinates of the last drag update.
var startOffset;
var startPos;
var blocked = false;

// typed text for keyboard control
var typetext ='';
var canvas;
var readonly=false;
var menuId;

function initTouched(canvasId, menuId, grammar, curDocument, editable) {
    readonly= editable===false;
    canvas= $('#' + canvasId);

    initMenu(menuId);
    if (grammar) loadGrammarFile(grammar);

    if (curDocument) {
	canvas.append($(curDocument));
    } else {
		if (canvas.children().length==0) {
		    canvas.append(dropArea('none','start'));
		    select(canvas.find('.arg'));
			}
    }
    activateEvents();
    updateAll(true);
}

function exitTouched() {
    removeEvents(false);
}

function pauseTouched() {
    removeEvents(false);
}

function resumeTouched() {
    activateEvents(false);
}

function activateEvents() {
    canvas.mousemove(msMove);
    canvas.mouseup(msUp);
    canvas.mousedown(msDown);
    var noSelect= function(evt) { $(evt.target).is('input') || evt.preventDefault(); };
    canvas.mousedown(noSelect);
    menuBar.mousedown(noSelect);
    canvas.attr('ontouchmove','msMove(event)');
    canvas.attr('ontouchend','msUp(event)');
    canvas.attr('ontouchstart','msDown(event)');
    $('html').keydown(keyPress);
}

function removeEvents() {
    canvas.unbind('mousemove');
    canvas.unbind('mouseup');
    canvas.unbind('mousedown');
    menuBar.unbind('mousedown');
    canvas.removeAttr('ontouchmove');
    canvas.removeAttr('ontouchend');
    canvas.removeAttr('ontouchstart');
    $('html').unbind('keydown', keyPress);
}

function updateAll(notrigger) {
    updateTypes(canvas);
    updateMenu();
    typetext='';
    if (!readonly && !notrigger)
	setTimeout( function() { canvas.trigger('update'); }, 1);
}

function elementArea(type) {
    var elt= $('<div class="box element"/>');
    elt.attr('data-type', type);
    return elt;
}

function textArea(text) {
    var tmp=$('<div class="box-text">');
    tmp.text(text);
    return tmp;
}

function dropArea(type, name) {
    var tmp= $('<div class="box arg"/>');
    var id=0;
    while ($('#box-'+id).length>0) id++;
    tmp.attr('id','box-'+id);
    tmp.attr('data-name', name);
    tmp.attr('data-type', type);
    tmp.text(name);
    return tmp;
}

function releaseBox(box) {
    var parent= box.parent();
    if (parent.hasClass('arg')) {
        parent.addClass('box');
        parent.text(parent.attr('data-name'));
    }
    box.remove();
    var safeBox= box.clone();
    var safeId= parent.attr('id');
    touched_undo(function() {
        insertBox($('#'+safeId), safeBox, true);
        select(safeBox);
    });
}

function insertBox(arg, item, keepIds) {
    arg.removeClass('box');
    item.removeClass('float');
    arg.contents().replaceWith(item);
    if (!keepIds) {
        var id=1;
        item.find('.box,.group').andSelf().each(
            function(i, d) {
                while ($('#box-'+id).length>0) id++;
                $(d).attr('id', 'box-'+id); 
            });
    }
    touched_undo(function() {
        releaseBox($('#'+item.attr('id')));
    });
}

function touched_undo(cmd) {
    if (cmd===true) {
        var undoCmd= undoBuffer.pop();
        var safeBuffer= undoBuffer;
        undoBuffer= redoBuffer;
        if (undoCmd) undoCmd();
        redoBuffer= undoBuffer;
        undoBuffer= safeBuffer;
        updateAll();
    } else if (cmd===false) {
        var undoCmd= redoBuffer.pop();
        var safeBuffer= redoBuffer;
        if (undoCmd) undoCmd();
        redoBuffer= safeBuffer;
        updateAll();
    } else {
        undoBuffer.push(cmd);
        redoBuffer=[];
    }
}

function select(obj) {
    unselectAll();
    obj.addClass('selected');
    // scroll selected object into visible area
    var top= obj.offset().top;
    var can= canvas.offset().top;
    if (top - $(window).scrollTop() < can) {
	$(window).scrollTop(top - can);
    } else if (top+30 > $(window).scrollTop()+$(window).height()) {
	$(window).scrollTop(top - $(window).height() + 30);
    }
}

function unselectAll() {
    typetext ='';
    $('.selected').removeClass('selected');
    window.getSelection().removeAllRanges()
}

// Move the selection along one of the following axes:
// 0: up
// 1: down
// 2: left
// 3: right
// 4: select the next selectable value
// 5: select the previous selectable value
function selectNext(obj, axis) {
    //console.log(axis);
    var reverse = axis == 0 || axis ==2 || axis== 5;
    var leftright =axis == 2 || axis == 3 ;
    var updown = axis ==0 || axis==1;
    var selectnext = axis ==4 || axis==5;
    var isup = false;
    var isactive=false;
    
    if (obj.size()>0) {
        var topoffset = obj.offset().top;
        var height = obj.height();
    }
    else {
        // no current selection
        isactive=true;
        obj = $('.box:first');
        height =0;
        topoffset = reverse ? 100000000 : 0;
    }
    while (!obj.is(canvas) && obj.length>0) {
        // check if current element should be selected
        if (isactive && obj.hasClass('box')) {
            if (selectnext) {
                if (!isup) {
                    select(obj);
                    return;
                }
            }
            if (updown && !isup) {
                // DOWN
                var isNewLine= obj.find('.box-body').length ==0;
                if (!reverse  && isNewLine && obj.offset().top > topoffset +height) {
                    select(obj);
                    return;
                }
                // UP
                if (reverse  && isNewLine && obj.offset().top < topoffset) {
                    select(obj);
                    return;
                }
            }
            if (leftright && !isup && obj.find('.box').length==0 || obj.is('.collapsed')) {
                select(obj);
                return;          
            }
        }
        isactive= true;
        // proceed to next element
        var childs = reverse ? obj.children(':last') : obj.children(':first');  
        if (!isup && !obj.is('.float,.collapsed') && childs.length>0) 
            obj = childs;
        else { 
            var next = reverse ? obj.prev() : obj.next();   
            if (next.length > 0) {
                isup = false;
                obj = next;
            }
            else {
                isup = true;
                obj = obj.parent();
            }
        }
    }
    unselectAll();
}

//keyboard control
function keyPress(evt) {
    //console.log(evt.which);
    if (!$(document.activeElement).is('INPUT')) {
        if (evt.ctrlKey) {
            if (evt.which == 67)
                //run code for CTRL+C 
                menu_copy();      
            if (evt.which == 86) 
                //run code for CTRL+V
                menu_paste();        
            if (evt.which == 88)    
				//run code for CTRL+X
                menu_cut();
            if (evt.which == 89)    
				//run code for CTRL+Y
                touched_undo(false);
            if (evt.which == 90)    
				//run code for CTRL+Z
                touched_undo(true);
        }
        else if (evt.keyCode > 64 && evt.keyCode < 91) {
            var type = String.fromCharCode(evt.keyCode);
            var menu = $(menuBar.find('li:not(.disabled)'));
            if (menu.find('li').length !=0) menu = menu.find('li');
            typetext = typetext + type;
            var chosen= [];
            for (var i = 0; i < menu.length; i++) {
                var item= $(menu[i]);
                if (typetext == item.text().substring(0, typetext.length).toUpperCase()) {
                    item.html('<span class="menuSelect">' + item.text().substring(0,  typetext.length) + '</span>' + item.text().substring( typetext.length, item.text().length));
                    chosen.push(item);
                    //console.log(item.text());
                }
                else {
                    item.text(menu[i].textContent);
                    item.addClass('disabled');
                }
                
            }
            if (chosen.length == 0) {
				typetext = '';
                updateMenu();
            }
            else if (chosen.length == 1) {
                typetext = '';
                evt.preventDefault();
                chosen[0].click();
            }           
            else if (chosen.length > 1) {          
                var resnum=100000;
                for (var num=0; num < chosen.length-1; num++) {
                	var numsame = 0;
                	var comp1 = chosen[num].text();
                	var comp2 = chosen[num+1].text();
                	while (comp1[numsame] && comp1[numsame] == comp2[numsame])
                		numsame++;
                   	resnum = Math.min(resnum, numsame);
                }
                if (resnum >= 2) {
                    typetext= chosen[0].text().substring(0,resnum).toUpperCase();
                    for(var num=0; num < chosen.length; num++) {
                        chosen[num].html('<span class="menuSelect">' + chosen[0].text().substring(0,resnum) + '</span>' + chosen[num].text().substring( typetext.length,chosen[num].text().length));   
                    }
                }
            }
        }
        else if (evt.keyCode ==8) {
        	evt.preventDefault();
	        typetext= '';
            updateMenu();
        }
        else if (evt.keyCode == 46)
            menu_delete();
        else if (evt.which==37) {        
            //KEY_LEFT
            evt.preventDefault();
            var selection= $('.selected');
            if (selection.size()>0)
                selectNext(selection, 2);
            updateMenu();
        }
        else if (evt.which ==39) {
            //KEY_RIGHT
            evt.preventDefault();
            var selection= $('.selected');
            if (selection.size()>0)
                selectNext(selection, 3);
            updateMenu();
        }
    }
    if (evt.which==40) {
        //KEY_DOWN
        evt.preventDefault();
        var selection= $('.selected');
        selectNext(selection,1);
        updateMenu();
    }
    else if (evt.which==9 || evt.which ==13) {
        // TAB, Enter
        evt.preventDefault();
        var selection= $('.selected');
        selectNext(selection, evt.shiftKey ? 5 : 4);
        updateMenu();
    }
    else if (evt.which==38) {
        // KEY_UP
        evt.preventDefault();
        var selection= $('.selected');
        selectNext(selection, 0);
        updateMenu();
    }
}

// msDown is called whenever the mouse button is pressed anywhere on the root document.
function msDown (event) {
    var evt= translateTouch(event);
    if (hand==null && evt.target!=null) {
        // find signaling object
        var active= false;
        var grabbed= $(evt.target);
        while(grabbed.length>0) {
            if (grabbed.is(canvas)) { 
		unselectAll(); 
		updateMenu();
		return; 
	    }
            active = active || grabbed.is('.box-text, .box.arg, .selected, .float');
            if (active && grabbed.hasClass('box')) break;
            grabbed= grabbed.parent();
        }
        if (!grabbed.hasClass('selected')) {
            select(grabbed);
            updateMenu();
        }
        if (!readonly) hand= grabbed;

        // store object position. Will be updated when mouse moves.
	blocked = { time : new Date().getTime() + (evt.isTouch ? 100 : 10) };
	startOffset = undefined;
	startPos= [ evt.clientX, evt.clientY ];
        event.preventDefault();
    }
}

function msMove(event) {
    var evt= translateTouch(event);
    if (hand) {
        event.preventDefault();   
	var hasMoved= hand.hasClass('dragged');

        if (hasMoved || Math.abs(startPos[0]-evt.clientX)+Math.abs(startPos[1]-evt.clientY)>20) {

            // compare the evt location with the blocked information
            if (blocked.top) { 
		if ((evt.clientY < blocked.top) || 
		    (evt.clientY - blocked.top > blocked.height) || 
		    (evt.clientX < blocked.left) || 
		    (evt.clientX - blocked.left > blocked.width)) {
                    // the X Y are not in the blocked area
                    blocked = false;
		}
            }
	    if (blocked.time) {
		// timeout to stop accidential drag
		if (new Date().getTime() > blocked.time)
		    blocked= false;
		else {
		    msUp(event);
		    return;
		}
	    }
            if (!hasMoved && !blocked) {
                // look for the containing element that can be moved
                while (!hand.hasClass('element')) {
                    if (hand.is(canvas) || hand.length==0) return;
                    hand = hand.parent();
                }
		startOffset= { top: hand.offset().top - startPos[1], 
			       left: hand.offset().left - startPos[0] };
                // record the original position
                if (!hand.hasClass('float')) {
                    // block object from snap back
                    var parent =hand.parent();
                    setTimeout(function () { blockArea(parent); },1);
                    // make the object float
                    releaseBox(hand);
                    hand.addClass('float');
                    canvas.append(hand);
                    updateAll();
                } 
                hand.addClass('dragged');
            }
            if (hand.hasClass('dragged') && !blocked) {
                var arg= $(evt.target);
                if (arg.is('.box.arg') && !arg.parents().is(hand)) {
                    // insert dragged element into target
		    startPos= [evt.clientX, evt.clientY];
                    blockArea(arg);
                    insertBox(arg, hand);
		    hand.removeClass('dragged');
                    updateAll();
                }
            }
            if (hand.hasClass('dragged')) {
                hand.offset({
                    top: startOffset.top + evt.clientY, 
                    left: startOffset.left + evt.clientX
                });
            }
        }
    }
}

function msUp (event) {
    if (hand) {
	if (hand.hasClass('dragged')) {
            hand.removeClass('dragged');
            updateAll();
        }
        hand= null;
    } 
    else if ($(event.target).is('body')) {
	unselectAll();
	updateMenu();
    }
}

// block a screan region against snapping back too early
function blockArea(arg) {
    blocked = {
        height: arg.outerHeight(),
        width: arg.outerWidth(),
        top: arg.offset().top - $(window).scrollTop(),
        left: arg.offset().left - $(window).scrollLeft()
    };
}

function clearErrors() {
    $('.runtime-error').removeClass('runtime-error');
    $('.runtime-message').remove();
}

function markError(id, message) {
    var obj= $('#'+id);
    if (obj.length>0) {
	obj.addClass('runtime-error');
	var msg= $('<div class="runtime-message">'+message+'</div>');
	obj.after(msg);
	msg.offset({ top: obj.offset().top + obj.height(), 
		     left: obj.offset().left + 20});
    }
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
