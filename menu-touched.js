var menu= [
       [ 'Def', check_istype('cmd'), menu_insert_cmd('def') ],
	   [ 'If-Else', check_istype('cmd'), menu_insert_cmd('if_else') ],
       [ 'For-Each', check_istype('cmd'), menu_insert_cmd('for_each') ],
	   [ 'Theta', check_istype('cmd'), menu_insert_cmd('theta') ],
	   [ 'Rename', check_istype('ident'), menu_edit],
	   [ 'Number', check_istype('number'), menu_edit],
	   [ 'Range', check_istype('range'), menu_add_range],
	   [ 'After', check_isInBody, menu_add_after ],
	   [ 'Before', check_isInBody, menu_add_before ],
	   [ 'Copy', check_isobj, menu_copy ],
	   [ 'Delete', check_canDelete, menu_delete ]
	  ];

function updateMenu() {
    var elt= $('#menu');
    elt.children().remove();
    for (var i in menu) {
	var show= false
	    for (var j in selection) {
		if (menu[i][1](selection[j])) {
		    show= true;
		    break;
		}
	    }
	if (show) {
	    var li= $('<li/>');
	    li.append(menu[i][0]);
	    li.click(menu[i][2]);
	    elt.append(li);
	}
    }
}

function check_canDelete(obj) {
    return check_isobj(obj) ||
	obj.parent().hasClass('box-body') &&
	obj.parent().parent().children('.box-body').size()>1;
}

function check_isInBody(obj) {
    return obj.parent().hasClass('box-body') &&
	!obj.hasClass('arg');
}

function check_isobj(obj) {
    return !obj.hasClass('arg');
}

function check_istype(type) {
    return function(obj) {
	return obj.attr('data-type')==type;
    }
}

function menu_add_after() {
    selection[0].parent().after(bodyArea());
    updateAll();
}

function menu_add_before() {
    selection[0].parent().before(bodyArea());
    updateAll();
}

function menu_edit() {
    var elt= $('#menu');
    elt.contents().remove();

    var input=$('<input type="text"/>');
    var set_button=$('<input type="button" value="OK"/>');

    if (!selection[0].hasClass('arg'))
	input.attr('value',selection[0].text());

    set_button.click(function() {
	    menu_edit_setValue(input[0].value);
	    updateAll();
	});

    elt.append(input);
    elt.append(set_button);
    input.focus();
}

function menu_edit_setValue(value) {
    if (value.replace(' ','')=='') {
	menu_delete();
    } else {
	var type= selection[0].attr('data-type');
	if (selection[0].hasClass('arg')) {
	    var div= elementArea();
	    div.attr('data-type', type);
	    div.addClass('text');
	    div.addClass('selected');
	    if (type=='ident') div.attr('original','true');
	    selection[0].replaceWith(div);
	    selection[0]=div;
	} else {
	    if (type=='ident') {
		var oldval= selection[0].text();
		$('.box.text')
		    .filter( function(index, obj) { 
			    return $(obj).text()==oldval; })
		    .each( function(index, obj) {
			    $(obj).text(value); });
				 
	    }
	}
	selection[0].text(value);
	selectNext(selection[0]);
    }
}


function menu_copy() {
    var copy= [];
    for (var i in selection) {
	copy[i]= selection[i].clone();
	copy[i].addClass('float');
	copy[i].removeAttr('original');
	$('#canvas').append(elementArea(copy[i]));
    }
    unselectAll();
    select(copy[0]);
}

function menu_delete() {
    for (var i in selection) {
	if (!selection[i].hasClass('float') &&
	    !selection[i].hasClass('arg')) {
	    var area= dropArea();
	    selection[i].before(area);
	}
	if (selection[i].parent().hasClass('box-body'))
	    selection[i].parent().remove();
	else
	    selection[i].remove();
    }
    selection=[];
    if (area)
	select(area);
    updateAll();
}


function menu_insert_cmd(name) {
    var commands= {
        def: function() {
            var div = elementArea();
            div.attr('data-arg-types', 'ident exp');
            div.append('<div class="box-text">Def</div>');
            div.append(dropArea());
            div.append('<div class="box-text"> &#x2190; </div>');
            div.append(dropArea());
            return div;
        },
        if_else: function() {
            var div = elementArea();
            div.attr('data-arg-types', 'exp');
            div.append('<div class="box-text">If</div>');
            div.append(dropArea());
            div.append(bodyArea());
            div.append('<div class="box-body"/><div class="box-text">Else</div>');
            div.append(bodyArea());
            return div;
        },
        for_each: function() {
            var div = elementArea();
            div.attr('data-arg-types', 'ident range');
            div.append('<div class="box-text">For Each</div>');
            div.append(dropArea());
            div.append('<div class="box-text">in</div>');
            div.append(dropArea());
            div.append(bodyArea());
            return div;
        },
        theta: function() {
            var div = elementArea();
            div.attr('data-arg-types', 'number');
            div.append('<div class="box-text">Theta</div>');
            div.append(dropArea());
            return div;
        }
    }

    return function() {
        var div= commands[name]();
        selection[0].replaceWith(div);
        if (div.parent().next('.box-body').size()==0)
        div.parent().after(bodyArea());
        selectNext(div);
        updateAll();
    }
}

function menu_add_range() {
    var div= elementArea();
    div.attr('data-arg-types','number number');
    div.append('<div class="box-text">[</div>');
    div.append(dropArea());
    div.append('<div class="box-text">:</div>');
    div.append(dropArea());
    div.append('<div class="box-text">]</div>');
    selection[0].replaceWith(div);
    selectNext(div);
    updateAll();
}
