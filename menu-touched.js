var menu= [
       [ 'Def', check_insert_cmd, menu_insert_cmd('def') ],
	   [ 'If-Else', check_insert_cmd, menu_insert_cmd('if_else') ],
       [ 'For-Each', check_insert_cmd, menu_insert_cmd('for_each') ],
	   [ 'Theta', check_insert_cmd, menu_insert_cmd('theta') ],
	   [ 'Rename', check_istype('ident'), menu_edit('ident')],
	   [ 'Number', check_istype('exp.number.const'), menu_edit('exp.number.const')],
       [ '+', check_istype('exp.number.op'), menu_add_op('exp.number.op', '+', 'exp.number exp.number')],
       [ '-', check_istype('exp.number.op'), menu_add_op('exp.number.op', '-', 'exp.number exp.number')],
       [ '&#215;', check_istype('exp.number.op'), menu_add_op('exp.number.op', '&#215;', 'exp.number exp.number')],
       [ '/', check_istype('exp.number.op'), menu_add_op('exp.number.op', '/', 'exp.number exp.number')],
	   [ 'Range', check_istype('exp.array'), menu_add_range],
       [ 'True', check_istype('exp.bool.const'), menu_edit('exp.bool.const','True')],
       [ 'False', check_istype('exp.bool.const'), menu_edit('exp.bool.const','False')],
       [ '>', check_istype('exp.bool.op'), menu_add_op('exp.bool.op', '>', 'exp.number exp.number')],
       [ '<', check_istype('exp.bool.op'), menu_add_op('exp.bool.op', '<', 'exp.number exp.number')],
       [ '&#x2265;', check_istype('exp.bool.op'), menu_add_op('exp.bool.op', '&#x2265;', 'exp.number exp.number')],
       [ '&#x2264;', check_istype('exp.bool.op'), menu_add_op('exp.bool.op', '&#x2264;', 'exp.number exp.number')],
       [ '=', check_istype('exp.bool.op'), menu_add_op('exp.bool.op', '=', 'exp.number exp.number')],
	   [ 'After', check_isInBody, menu_add_after ],
	   [ 'Before', check_isInBody, menu_add_before ],
	   [ 'Copy', check_isobj, menu_copy ],
       [ 'Paste', check_canPaste, menu_paste ],
	   [ 'Delete', check_canDelete, menu_delete ]
	  ];
var clipboard= null;


function updateMenu() {
    var elt= $('#menu');
    elt.children().remove();
    for (var i in menu) {
        var show = false;
        $('.selected').each(function(index, obj) {
            show = show || menu[i][1]($(obj));
        });
        if (show) {
            var li = $('<li/>');
            li.append(menu[i][0]);
            li.click(menu[i][2]);
            elt.append(li);
        }
    }
}

function check_canDelete(obj) {
    return check_isobj(obj) ||
	obj.hasClass('cmd') &&
	obj.parent().children('.box.cmd').size()>1;
}

function check_canPaste(obj) {
    return clipboard && obj.hasClass('arg');
}

function check_isInBody(obj) {
    return obj.hasClass('cmd') && !obj.hasClass('arg');
}

function check_isobj(obj) {
    return !obj.hasClass('arg');
}

function check_insert_cmd(obj) {
    return obj.attr('data-type')=='cmd' && obj.hasClass('arg');
}

function check_istype(type) {
    var pattern= type_pattern(type);
    return function(obj) {
	    return obj.attr('data-type').match(pattern);
    }
}

function menu_add_after() {
    $('.selected:last').after(bodyArea());
    updateAll();
}

function menu_add_before() {
    $('.selected:first').before(bodyArea());
    updateAll();
}

function menu_edit(type, constValue) {
    return function() {
        if (constValue) {
            menu_edit_setValue(constValue, type);
    	} else {
            var elt= $('#menu');
            elt.contents().remove();
        
            var input=$('<input type="text"/>');
            var set_button=$('<input type="button" value="OK"/>');
        
            if (!$('.selected').hasClass('arg'))
        	input.attr('value',$('.selected').text());

            var submit= function() { menu_edit_setValue(input[0].value, type); };

            input.keypress(function(e){
                if(e.which == 13) submit();
            });

            set_button.click(submit);
        
            elt.append(input);
            elt.append(set_button);
            
            input.focus();
    	}
    }
}

function menu_edit_setValue(value, type) {
    var selection= $('.selected');
    value= value.replace(/^ +| +$/g,'');
    if (value=='') {
        if (!selection.hasClass('arg'))
	        menu_delete();
        else
            updateAll();
    } else {
	if (selection.hasClass('arg')) {
	    var div= elementArea();
	    div.attr('data-type', type);
	    div.addClass('text');
	    div.addClass('selected');
	    selection.replaceWith(div);
	    selection=div;
	} else {
	    if (type=='ident') {
		var oldval= selection.text();
		$('.box.text')
		    .filter( function(index, obj) { 
			    return $(obj).text()==oldval; })
		    .each( function(index, obj) {
			    $(obj).text(value); });
				 
	    }
	}
	selection.text(value);
	selectNext(selection);
    updateAll();
    }
}

function menu_paste() {
    $('.selected').replaceWith(elementArea(clipboard.clone()));
}

function menu_copy() {
    clipboard= $('.selected').clone();
}

function menu_delete() {
    var selection = $('.selected');
    if (!selection.hasClass('float') && !selection.hasClass('arg')) {
        var area = dropArea();
        selection.before(area);
    }
    selection.remove();
    if (area) select(area);
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
            div.attr('data-arg-types', 'exp.bool');
            div.append('<div class="box-text">If </div>');
            div.append(dropArea());
            div.append(bodyArea());
            var div2=$('<div class="box-else"><div class="box-text">Else</div></div>');
            div2.append(bodyArea());
            div.append(div2);
            return div;
        },
        for_each: function() {
            var div = elementArea();
            div.attr('data-arg-types', 'ident exp.array');
            div.append('<div class="box-text">For Each </div>');
            div.append(dropArea());
            div.append('<div class="box-text"> in </div>');
            div.append(dropArea());
            div.append(bodyArea());
            return div;
        },
        theta: function() {
            var div = elementArea();
            div.attr('data-arg-types', 'exp.number');
            div.append('<div class="box-text">Theta </div>');
            div.append(dropArea());
            return div;
        }
    }

    return function() {
        var div= commands[name]();
        div.attr('data-type','cmd');
        div.addClass('cmd');
        $('.selected').replaceWith(div);
        if (div.next('.box.cmd').size()==0)
            div.after(bodyArea());
        selectNext(div);
        updateAll();
    }
}

function menu_add_range() {
    var div= elementArea();
    div.attr('data-type','exp.array.range');
    div.attr('data-arg-types','exp.number exp.number');
    div.append('<div class="box-text">[</div>');
    div.append(dropArea());
    div.append('<div class="box-text">:</div>');
    div.append(dropArea());
    div.append('<div class="box-text">]</div>');
    $('.selected').replaceWith(div);
    selectNext(div);
    updateAll();
}

function menu_add_op(type, symbol, argTypes) {
    return function() {
        var selection= $('.selected');
        if (selection.hasClass('arg')) {
            var div= elementArea();
            div.attr('data-type', type);
            div.attr('data-arg-types',argTypes);
            div.append(dropArea());
            div.append('<div class="box-text">'+symbol+'</div>');
            div.append(dropArea());
            selection.replaceWith(div);
            selectNext(div);
        } else {
            selection.find('.box-text').html(symbol);
        }
        updateAll();
    }
}
