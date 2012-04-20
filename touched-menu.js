var menu= [
       [ 'Def', check_insert_cmd, menu_insert_cmd('def') ],
	   [ 'If-Else', check_insert_cmd, menu_insert_cmd('if_else') ],
       [ 'Loop', check_insert_cmd, menu_insert_cmd('loop') ],
	   [ 'Theta', check_insert_cmd, menu_insert_cmd('theta') ],
	   [ 'Rename', check_istype('ident.new'), menu_edit('ident')],
       [ 'Vars', check_hasVars('>exp'), showVars],
       [ 'Number', check_menuType('exp.number'), [
           [ 'Constant', check_istype('exp.number.const'), menu_edit('exp.number.const')],
           [ '+1', check_istype('exp.number.const'), menu_edit('exp.number.const', 1)],
           [ '-1', check_istype('exp.number.const'), menu_edit('exp.number.const', -1)],
           menu_add_op('+', 'exp.number.op','@exp.number + @exp.number', 100),
           menu_add_op('–', 'exp.number.op', '@exp.number – @exp.number', 110),
           menu_add_op('×', 'exp.number.op', '@exp.number × @exp.number', 120),
           menu_add_op('÷', 'exp.number.op', '@exp.number ÷ @exp.number', 130)
       ]],
       [ 'Bool', check_menuType('exp.bool'), [
           menu_add_op('True', 'exp.bool.const', 'True'),
           menu_add_op('False', 'exp.bool.const', 'False'),
           menu_add_op('>', 'exp.bool.n2', '@exp.number &gt; @exp.number', 50),
           menu_add_op('<', 'exp.bool.n2', '@exp.number &lt; @exp.number', 50),
           menu_add_op('≥', 'exp.bool.n2', '@exp.number ≥ @exp.number', 50),
           menu_add_op('≤', 'exp.bool.n2', '@exp.number ≤ @exp.number', 50),
           menu_add_op('=', 'exp.bool.e2', '@exp = @exp', 50),
           menu_add_op('⋁ Or', 'exp.bool.b2', '@exp.bool ⋁ @exp.bool', 20),
           menu_add_op('∧ And', 'exp.bool.b2', '@exp.bool ∧ @exp.bool', 30),
           menu_add_op('¬ Not', 'exp.bool.b1', '¬@exp.bool', 40)
       ]],
       [ 'List', check_menuType('exp.list'), [
           menu_add_op('Row', 'exp.list.list', '[@exp]'),
           menu_add_op('Column', 'exp.list.list', '[@exp]'),
           menu_add_op('Range', 'exp.list.range', '[@exp.number : @exp.number]'),
           menu_add_op('⊕ Concat', 'exp.list.func.2', '@exp.list ⊕ @exp.list') 
       ]],
       [ 'f(#)', check_menuType('exp.number.func'), [
           menu_add_op('Abs', 'exp.number.func.n1', 'abs(@exp.number)'),
           menu_add_op('Min', 'exp.number.func.n2','min(@exp.number, @exp.number)'),
           menu_add_op('Max', 'exp.number.func.n2', 'max(@exp.number, @exp.number)'),
           menu_add_op('Exp', 'exp.number.func.n1', 'exp(@exp.number)'),
           menu_add_op('Log', 'exp.number.func.n1', 'log(@exp.number)'),
           menu_add_op('Sqrt', 'exp.number.func.n1', '√(@exp.number)'),
           menu_add_op('Pow', 'exp.number.func.n2', 'pow(@exp.number, @exp.number)'),
           menu_add_op('Length', 'exp.number.func.l1', 'length(@exp.list)'),
           menu_add_op('Sum', 'exp.number.func.l1', 'sum(@exp.list)')
       ]],
       [ '.Methods', check_menuType('exp.meth'), [
           menu_add_op('[] Element', 'exp.meth.elt','@exp [@exp.number]'),
           menu_add_op('.Field', 'exp.meth.field','@exp . @text')
       ]],
       [ 'Before', check_isInBody, menu_add_before ],
	   [ 'After', check_isInBody, menu_add_after ],
	   [ 'Copy', check_canCopy, menu_copy ],
       [ 'Paste', check_canPaste, menu_paste ],
	   [ 'Cut', check_canDelete, menu_delete ]
	  ];
var clipboard= null;
var submitMenu= null;

function updateMenu() {
    submitMenu= null;
    var elt= $('#menu');
    elt.children().remove();
    menuItems(elt, menu);
}

function menuItems(container, menu) {
    var selection= $('.selected');
    if (selection.length>0) {
        for (var i in menu) {
            var state = menu[i][1]===true || menu[i][1](selection);
            if (state && state.show!==false) {
                if (state.inline) {
                    menuItems(container, menu[i][2]);
                } else {
                    container.append(makeMenuEntry(menu[i][0], menu[i][2], state));
                }
            }
        }
    }
}

function makeMenuEntry(name, submenu, state) {
    var li = $('<li/>');
    li.append(name);
    if (state.disabled) li.addClass('disabled');
    else {
        li.click(function() {
            if (typeof(submenu) == 'function') {
                submenu(li);
            } else {
                var popup= li.find('>.popup');
                if (popup.length==0) {
                    popup= $('<ul class="popup"/>');
                    menuItems(popup, submenu);
                    li.append(popup);
                } else {
                    popup.remove();
                }
            }
        });
    }
    return li;
}

function showVars(li) {
    var popup= li.find('>.popup');
    if (popup.length==0) {
        var has={};
        popup= $('<ul class="popup"/>');
        $('.box').filter(function() {
            return $(this).attr('data-type')=='ident';
        }).each(function() {
            var varName= $(this).text();
            if (!has[varName]) {
                has[varName]= true;
                var subli= $('<li/>');
                subli.text(varName);
                subli.click(function() {
                    menu_edit_setValue(varName,'var-use');
                });
                popup.append(subli);
            }
        });
        li.append(popup);
    } else {
        popup.remove();
    }

}

function check_canDelete(obj) {
    return !obj.hasClass('arg')
	|| obj.attr('data-type')=='cmd' && obj.parent().children('.box').size()>1
    || obj.parent().attr('data-type')=='exp.list.list';
}

function check_canPaste(obj) {
    return clipboard && obj.hasClass('arg');
}

function check_isInBody(obj) {
    return !obj.hasClass('arg') && obj.parent().hasClass('box-body') ||
            type_isa(obj.parent(), '>exp.list.list');
}

function check_canCopy(obj) {
    return !obj.hasClass('arg');
}

function check_insert_cmd(obj) {
    return obj.attr('data-type')=='cmd' && obj.hasClass('arg');
}

function check_istype(type) {
    return function(obj) {
	    return type_isa(obj, type);
    }
}

function check_hasVars(type) {
    return function(obj) {
        return (obj.hasClass('arg') || obj.attr('data-type')=='var-use') && 
            type_isa(obj, type) &&
            $('.box').filter(function() {
                return $(this).attr('data-type')=='ident';
            }).length>0;
    }
}

function check_menuType(type, inlineType) {
    return function(obj) {
        var objType= obj.attr('data-type');
        var isSup= type_isSuper(type, objType);
        var isSub= type_isSuper(objType, type);
        var isObj= !obj.hasClass('arg');
        return {
            show: isObj && isSup || !isObj && isSub,
            inline: isSup
        };
    }
}

function menu_add_after() {
    var div= dropArea();
    $('.selected:last').after(div);
    select(div);
    updateAll();
}

function menu_add_before() {
    var div= dropArea();
    $('.selected:first').before(div);
    select(div);
    updateAll();
}

function menu_edit(type, constValue) {
    return function() {
        var selection= $('.selected');
        if (constValue) {
            var value= constValue;
            if (typeof(constValue)=='number')
                if (!selection.hasClass('arg'))
                    value= parseFloat(selection.text())+constValue;
            menu_edit_setValue(value.toString(), type);
    	} else {
            var elt= $('#menu');
            elt.contents().remove();
        
            var input=$('<input/>');
            if (type=='exp.number.const') input.attr('type','number');
            var set_button=$('<input type="button" value="OK"/>');
            var cancel_button=$('<input type="button" value="Cancel"/>');
        
            if (!selection.hasClass('arg'))
        	    input.attr('value',$('.selected').text());
            submitMenu= function() { menu_edit_setValue(input[0].value, type); };
            cancel_button.click(function() { updateMenu(); });
            set_button.click(submitMenu);
        
            elt.append(input);
            elt.append(set_button);
            elt.append(cancel_button);
            
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
    updateMenu();
    }
}

function menu_paste() {
    $('.selected').replaceWith(clipboard.clone());
    updateAll();
}

function menu_copy() {
    clipboard= $('.selected').clone();
    clipboard.removeClass('float');
    if (clipboard.hasClass('arg')) clipboard= null;
}

function menu_delete() {
    menu_copy();
    var selection = $('.selected');
    if (!selection.hasClass('float') && !selection.hasClass('arg')) {
        var area = dropArea();
        selection.before(area);
    }
    if (area) select(area); else selectNext(selection);
    selection.remove();
    updateAll();
}

function menu_insert_cmd(name) {
    var commands= {
        def: function() {
            var div = elementArea();
            div.attr('data-arg-types', 'ident exp');
            div.append('<div class="box-text">Def</div>');
            div.append(dropArea());
            div.append('<div class="box-text"> ← </div>');
            div.append(dropArea());
            return div;
        },
        if_else: function() {
            var div = elementArea();
            div.attr('data-arg-types', 'exp.bool cmd cmd');
            div.append('<div class="box-text">If </div>');
            div.append(dropArea());
            div.append(bodyArea());
            var div2=$('<div class="box-else"><div class="box-text">Else</div></div>');
            div2.append(bodyArea());
            div.append(div2);
            return div;
        },
        loop: function() {
            var div = elementArea();
            div.attr('data-arg-types', 'ident exp.list cmd');
            div.append('<div class="box-text">Loop </div>');
            div.append(dropArea());
            div.append('<div class="box-text"> ← </div>');
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
        var selection=$('.selected');
        var div= commands[name]();
        div.attr('data-type','cmd');
        if (selection.next().size()==0)
            selection.after(dropArea());
        selection.replaceWith(div);
        selectNext(div);
        updateAll();
    }
}

function menu_add_op(name, type, pattern, priority) {
    var args= pattern.match(/@[a-zA-Z0-9.]*|[^@]+/g);
    return [ name, 
    function(obj) { 
        return {
            show: type_isa(obj, type),
            disabled: obj.attr('data-name')==name
        };
    },
    function() {
        var selection= $('.selected');
        var div= elementArea();
        var argTypes= '';
        var oldArgs= selection.find('>.box');
        for (var i in args) {
            if (args[i][0]=='@') {
                argTypes= argTypes+args[i].substring(1)+' ';
                var newArg= oldArgs.splice(0,1)[0] || dropArea();
                div.append(newArg);
                if (type=='exp.list.list')
                    div.append(oldArgs);
            } else {
                div.append('<div class="box-text">'+args[i]+'</div>');
            }
        }
        if (type=='exp.list.list')
            div.addClass(name);
        div.attr('data-type', type);
        div.attr('data-name', name);
        div.attr('data-arg-types',argTypes);
        div.attr('data-priority', priority);
        var proceed= pattern.match(/@/) && selection.hasClass('arg');
        selection.replaceWith(div);
        if (proceed) selectNext(div); else select(div);
        updateAll();
    }];
}
