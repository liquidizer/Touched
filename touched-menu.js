var grammarMenu= {};
var editMenu= [
    [ 'Text', check_isType('text'), menu_edit('text') ],
    [ 'Number', check_isType('number'), menu_edit('number') ],
    [ '+1', check_isType('number',true), menu_add('number',1) ],
    [ '-1', check_isType('number',true), menu_add('number',-1) ],
    [ 'Before', check_canRepeat, menu_add_before ],
    [ 'After', check_canRepeat, menu_add_after ],
    [ 'Copy', check_canCopy, menu_copy ],
    [ 'Paste', check_canPaste, menu_paste ],
    [ 'Cut', check_canDelete, menu_delete ]
];

var clipboard= null;
var submitMenu= null;

// initialize menu entries
function initMenu() {
    loaded= {};
    var param= location.search.match('[?&]grammar=([^&]*)');
    if (param) {
        loadGrammarFile(decodeURI(param[1]));
    } else {
	loadGrammarFile('grammar/grammar.g');
    }
}

// load a grammar file
function loadGrammarFile(url) {
    if (!loaded[url]) {
        loaded[url] = true;
        $.get(url, function(response) { initGrammar(response, url); });
    }
}

// Interpret a loaded grammakr definition
function initGrammar(content, url) {
    var expand= function(code, item, arg) {
	code.args(arg || 'content').each( function(i,cmd) {
	    if (cmd.text) item.append(textArea(cmd.text));
	    else cmd.call(item);
	});
    }
    var code= toCode($(content).find('.element:first'), {
	touched : {
	    grammar : function(code) {
		var root= code.arg('root').text;
		$('.arg[data-name=start]:first').attr('data-type',root);
		code.args('item').each( function(i,cmd) { cmd.call(grammarMenu); });
	    },
	    item : {
		menu : function(code, menu) {
		    var name= code.arg('name').text;
		    var submenu= {};
		    menu[name]= submenu;
		    code.args('item').each( function(i,cmd) { cmd.call(submenu); });
		    for (key in submenu) {
			var subtype= submenu[key]._type;
			submenu._type= type_unify(subtype, submenu._type || subtype);
		    }
		},
		element : function(code, menu) {
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
		},
	    }
	}
    }).call();
    updateMenu();
}

// update the shown menu with respect to the current selection
function updateMenu() {
    if (submitMenu) {
	submitMenu();
	submitMenu= null;
	updateAll();
	return;
    }
    var bar= $('#menu');
    bar.children().remove();
    var selection=$('.selected');
    if (selection.is('.arg'))
	fillMenu(selection.attr('data-type'), grammarMenu, bar);
    if (selection.length>0) {
	for (var i in editMenu) {
	    if (editMenu[i][1](selection)) {
		var li= $('<li class="builtin"/>');
		li.text(editMenu[i][0]);
		li.click(editMenu[i][2]);
		bar.append(li);
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
    return obj.parent().hasClass('arg') || 
    obj.hasClass('float') ||
	getContainer(obj).parent().attr('data-repeat')=='*';
}

function check_canPaste(obj) {
    return clipboard && obj.hasClass('arg') && obj.hasClass('box');
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
	var elt= $('#menu');
	elt.contents().remove();

	//add input controls
	var input=$('<input id="input"/>');
	var set_button=$('<input type="button" id="okbutt" value="OK"/>');
	var cancel_button=$('<input type="button" value="Cancel"/>');

	// fill existing text into input field
	if (!selection.hasClass('arg'))
	    input.attr('value',selection.text());

	// define submit and cancel callbacks
	submitMenu= function() {
	    menu_edit_setValue(selection, type, input[0].value); 
	};
	var cancelMenu= function() { submitMenu=null; updateMenu(); }

	input.keydown(function(evt) { if (evt.which==27) cancelMenu(); });
	cancel_button.click(cancelMenu);
	set_button.click(submitMenu);

	//insert input elements into menu bar
	elt.append(input);
	elt.append(set_button);
	elt.append(cancel_button);
            
	input.focus();
    }
}

// set the value of the selected text element
function menu_edit_setValue(selection, type, value) {
    value= value.replace(/^\s+|\s+$/g,'');
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

function menu_paste() {
    var selection= $('.selected');
    if (check_canPaste(selection)) {
        var clone= clipboard.clone();
        insertBox(selection, clone);
        select(clone);
        updateAll();
    }
}

function menu_copy() {
    var selection= $('.selected');
    if (check_canCopy(selection)) {
        clipboard= selection.clone();
        if (clipboard.hasClass('arg')) clipboard= null;
    }
}

function menu_delete() {
    menu_copy();
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

