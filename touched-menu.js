var menuBar;
var grammarMenu= {};
var editMenu= [
    [ 'Annotate', check_isElement, menu_comment ],
    [ 'Collapse', check_canCollapse, menu_collapse, { ro: true } ],
    [ 'Uncollapse', check_isCollapsed, menu_uncollapse, {ro: true } ],
    [ 'Text', check_isType('text'), menu_edit('text') ],
    [ 'Number', check_isType('number'), menu_edit('number') ],
    [ 'Color', check_isType('color'), menu_edit('color') ],
    [ 'File', check_isExt('file', 'menu_file'), function() { window['menu_file'](); } ],
    [ '+1', check_isType('number',true), menu_add('number',1) ],
    [ '-1', check_isType('number',true), menu_add('number',-1) ],
    [ 'Before', check_canRepeat, menu_add_before ],
    [ 'After', check_canRepeat, menu_add_after ],
    [ 'Copy', check_canCopy, menu_copy, {ro: true} ],
    [ 'Paste', check_canPaste, menu_paste ],
    [ 'Cut', check_canDelete, menu_cut ]
];

// initialize menu entries
function initMenu(menuId) {
    menuBar= $('#'+menuId);

    // load a grammar provided by request parameters
    var param= location.search.match('[?&]grammar=([^&]*)');
    if (param) {
        loadGrammarFile(decodeURI(param[1]));
    }
}

// load the document grammar file
function loadGrammarFile(url, callback) {
    loaded= {};
    grammarMenu={};
    initGrammar(url, function(menu) {
	grammarMenu= menu;
	updateMenu();
	callback && callback();
    })
}

// Loaded and interpret grammar definition definition file
function initGrammar(url, callback) {
    var expand= function(code, item, arg) {
	code.args(arg || 'content').forEach( function(cmd) {
	    if (cmd.text) item.append(textArea(cmd.text));
	    else cmd.call(item);
	});
    }
    var commands= {
	touched : {
	    grammar : function(code, _, callback) {
		var root= code.arg('root').text;
		$('.arg[data-name=start]:first').attr('data-type',root);
		code.fold('item', {}, callback);
	    },
	    item : {
		require : function(code, menu, callback) {
		    initGrammar(code.arg('src').text, callback);
		},
		menu : function(code, menu, callback) {
		    var name= code.arg('name').text;
		    var submenu= {};
		    menu[name]= submenu;
		    code.fold('item', submenu, function(submenu) {
			for (key in submenu) {
			    var subtype= submenu[key]._type;
			    submenu._type= type_unify(subtype, submenu._type || subtype);
			}
			callback(menu);
		    });
		},
		element : function(code, menu, callback) {
		    var name= code.arg('name').text;
		    var type= code.arg('type').text;
		    menu[name]={
    			_type: type,
			expand: function() { 
			    var item = elementArea(type);
			    expand(code, item); 
			    return item;
			}
		    }
		    callback(menu);
    		}
	    },
	    "item-content" : {
		keyword : function(code, item) {
		    var text= code.arg('keyword').text;
		    var area= textArea(text)
		    area.addClass('keyword');
		    item.append(area);
		},
		arg : function(code, item) {
		    item.append(dropArea(code.arg('type').text, 
					 code.arg('name').text));
		},
		block : function(code, item) {
		    var div= $('<div class="group box-body" data-repeat="*"/>');
		    item.append(div);
		    expand(code, div);
		}
	    }
	}
    };
    if (!loaded[url]) {
        loaded[url] = true;
        $.get(url, function(content) { 
	    toCode($(content).find('.element:first')[0], commands, callback).call({}, callback);
	});
    } else {
	callback && callback();
    }
}

// update the shown menu with respect to the current selection
function updateMenu() {
    if ($('#okbutt').length>0) {
	$('#okbutt').click();
	return;
    }
    var selection=$('.selected');
    menuBar.children().remove();
    if (!readonly && selection.is('.arg'))
	fillMenu(selection.attr('data-type'), grammarMenu, menuBar);
    if (selection.length>0) {
	for (var i=0; i<editMenu.length; i++) {
	    if (!readonly || (editMenu[i][3]||{}).ro) {
		if (editMenu[i][1](selection)) {
		    var li= $('<li class="builtin"/>');
		    li.text(editMenu[i][0]);
		    li.click(editMenu[i][2]);
		    menuBar.append(li);
		}
	    }
	}
    }
}

// fill a ol list with list items from a menu structure
function fillMenu(type, menu, parent) {
    var submenus=[];
    for (var name in menu) {
	if (!name.match(/^_/)) {
	    var submenu= menu[name];
	    if (!submenu._type 
		|| type_isSuper(type, submenu._type)
		|| !type.expand && type_isSuper(submenu._type, type)) {
		submenus.push(submenu);
		var entry= menuEntry(type, name, submenu);
		parent.append(entry);
	    }
	}
    }
    // expand menu if only one entry fits the current selection
    if (submenus.length==1 && (!submenus[0] || !submenus[0].expand)) {
	parent.find(':last').remove();
	fillMenu(type, submenus[0], parent);
    }
}

// create a list item to inserted into menu list
function menuEntry(type, name, submenu) {
    var li= $('<li/>');
    li.text(name);
    li.click(function() {
	var pop= li.find('.popup');
	if (pop.length>0) pop.remove();
	else {
	    if (submenu.expand) insertItem(submenu)
	    else {
		li.parent().find('ul').remove();
		var ul= $('<ul class="popup"/>');
		li.append(ul);
		fillMenu(type, submenu, ul);
	    }
	}
	return false;
    });
    return li;
}

// insert an item from the grammar template at the current selection
function insertItem(template) {
    var selection = $('.selected');
    // if check_canRepeat and there is no next neigbor then:
    if (check_canRepeat(selection) && selection.next('.arg').length == 0)
       selection.after(dropArea(selection.attr('data-type'), selection.attr('data-name')));
    var item= template.expand();
    insertBox(selection, item);
    selectNext(item, 4);
    updateAll();
}

function getContainer(obj) {
    if (obj.hasClass('arg')) return obj;
    return obj.parent();
}

function check_canDelete(obj) {
    return !readonly && (
	obj.parent().hasClass('arg') || 
	    obj.hasClass('float') ||
	    getContainer(obj).parent().attr('data-repeat')=='*');
}

function check_canPaste(obj) {
    var clipboard= localStorage.getItem('Touched-clipboard');
    return !readonly && clipboard && obj.is('.arg.box');
}

function check_canRepeat(obj) {
    var o= getContainer(obj);
    return o.hasClass('arg') && o.parent().attr('data-repeat')=='*';
}

function check_canCopy(obj) {
    return !obj.hasClass('arg');
}

function check_isType(type, isobj) {
    return function(obj) {
        return type_isa(obj, type) && (!isobj || !obj.hasClass('arg'));
    };
}

function check_isExt(type, fun) {
    return function(obj) { return window[fun] && check_isType(type)(obj); }
}

function check_isElement(obj) {
    return obj.hasClass('element');
}

function check_canCollapse(obj) {
    return !obj.hasClass('collapsed') && 
	obj.children('.comment').length>0 &&
	obj.find('.box-body').length>0;
}

function check_isCollapsed(obj) {
    return obj.hasClass('collapsed');
}

function menu_add_after() {
    var selection= $('.selected:last');
    if (!selection.hasClass('arg')) selection=selection.parent();
    selection.after(dropArea(selection.attr('data-type'), 
			     selection.attr('data-name')));
    select(selection.next());
    updateAll();
}

function menu_add_before() {
    var selection= $('.selected:first');
    if (!selection.hasClass('arg')) selection=selection.parent();
    selection.before(dropArea(selection.attr('data-type'), 
			      selection.attr('data-name')));
    select(selection.prev());
    updateAll();
}

function menu_add(type, increment) {
    return function() {
        var selection= $('.selected');
	value= parseFloat(selection.text())+increment;
	menu_edit_setValue(selection, type, value.toString() );
	updateAll();
    }
}

// show a text input control for setting the selected text item
function menu_edit(type) {
    return function() {
	var selection= $('.selected');
	var value= selection.hasClass('arg') ? '' : selection.text();
	menu_showInput(type, value, function(value) {
	    menu_edit_setValue(selection, type, value);
	});
    }
}

function menu_comment() {
    var selection= $('.selected');
    var value=selection.children('.comment').text() || '';
    menu_showInput('text', value, function(value) {
	var div= $('<div class="box-text comment"/>');
	div.text(value);
	selection.children('.comment').remove();
	if (value)
	    selection.prepend(div);
    });
}

function menu_showInput(type, value, callback) {
    menuBar.contents().remove();

    //add input controls
    var input=$('<input id="input" type="'+type+'"/>');
    var set_button=$('<input type="button" id="okbutt" value="OK"/>');
    var cancel_button=$('<input type="button" value="Cancel"/>');

    // fill existing text into input field
    input.val(value);

    // define cancel action
    var cancelAction= function() { set_button.remove(); updateMenu(); }
    input.keydown(function(evt) { if (evt.which==27) cancelAction(); });
    cancel_button.click(cancelAction);

    // define set action
    set_button.click(function() { 
	callback(input.val()); 
	set_button.remove();
	updateAll(); 
    });
    
    //insert input elements into menu bar
    menuBar.append(input)
	.append(set_button)
	.append(cancel_button);
    
    input.focus();
}

// set the value of the selected text element
function menu_edit_setValue(selection, type, value) {
    if (value=='') {
        if (!selection.hasClass('arg'))
	    menu_delete();
    } else {
	if (selection.hasClass('arg')) {
	    var div= textArea();
	    div.addClass('box');
	    div.attr('data-type', type);
	    insertBox(selection, div);
	    selection= div;
	}
	selection.text(value);
    }
}

function clear_clipboard() {
    localStorage.removeItem('Touched-clipboard');
}

function menu_paste() {
    var selection= $('.selected');
    if (check_canPaste(selection)) {
	var clipboard= $(localStorage.getItem('Touched-clipboard'));
        insertBox(selection, clipboard);
        select(clipboard);
        updateAll();
    }
}

function menu_copy() {
    var selection= $('.selected');
    if (check_canCopy(selection)) {
	var clipboard= undefined;
        if (!selection.hasClass('arg'))
            clipboard= selection[0].outerHTML || // ff bug
	         selection.clone().wrap('<div/>').parent().html();
	localStorage.setItem('Touched-clipboard', clipboard);
	updateMenu();
    }
}

function menu_cut(){
	 menu_copy();
	 menu_delete();
}

function menu_delete() {
   
    var selection = $('.selected');
    if(check_canDelete(selection)) {
        selectNext(selection,4)
        var parent= selection.parent();
        releaseBox(selection);
        if (parent.hasClass('arg')) {
    	    select(parent);
        }
        updateAll();
    }
}

function menu_collapse() {
    $('.selected').addClass('collapsed');
    updateMenu();
}

function menu_uncollapse() {
    $('.selected').removeClass('collapsed');
    updateMenu();
}
