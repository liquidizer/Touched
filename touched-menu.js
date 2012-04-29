var grammarMenu= {};
var editMenu= [
    [ 'Text', check_canText, menu_edit('text') ],
    [ 'Before', check_isInBody, menu_add_before ],
    [ 'After', check_isInBody, menu_add_after ],
    [ 'Copy', check_canCopy, menu_copy ],
    [ 'Paste', check_canPaste, menu_paste ],
    [ 'Cut', check_canDelete, menu_delete ]
];

var clipboard= null;
var submitMenu= null;

// initialize menu entries
function initMenu() {
    loadGrammarFile('grammar-xml.xml');
}

// load a grammar file
function loadGrammarFile(url) {
  var request= new XMLHttpRequest();
  request.onreadystatechange= function() {
      if (request.readyState==4) initGrammar($(request.responseText));
  };
  request.open("GET", encodeURI(url), true);
  request.send(null);
}

function initGrammar(content) {
    $(content).find('item').each(function (i, item) {
	var name= $(item).attr('name').match(/[^\/]+/g);
	var curMenu= grammarMenu;
	while (name[0]) {
	    var sec= name.shift();
	    if (!curMenu[sec]) curMenu[sec]= {};
	    curMenu= curMenu[sec]
	}
	curMenu.template= $(item);
	curMenu._type= $(item).attr('type');
    });
    updateMenu();
}

function updateMenu() {
    submitMenu= undefined;
    var bar= $('#menu');
    bar.children().remove();
    var selection=$('.selected');
    if (selection.is('.arg'))
	fillMenu(selection.attr('data-type'), grammarMenu, bar);
    if (selection.length>0) {
	for (var i in editMenu) {
	    if (editMenu[i][1](selection)) {
		var li= $('<li/>');
		li.text(editMenu[i][0]);
		li.click(editMenu[i][2]);
		bar.append(li);
	    }
	}
    }
}

function fillMenu(type, menu, parent) {
    for (var name in menu) {
	var submenu= menu[name];
	if (!submenu._type 
	    || type_isSuper(type, submenu._type)) {
	    parent.append(menuEntry(type, name, submenu));
	}
    }
}

function menuEntry(type, name, submenu) {
    var li= $('<li/>');
    li.text(name);
    li.click(function() {
	var pop= li.find('.popup');
	if (pop.length>0) pop.remove();
	else {
	    if (submenu.template) insertItem(submenu.template)
	    else
		fillMenu(type, submenu,
			 li.append('<ul/>').find(':last').addClass('popup'));
	}
	return false;
    });
    return li;
}

function insertItem(template) {
    var selection= $('.selected');
    var item= elementArea(template.attr('type'));
    expandTemplate(template, item);
    insertBox(selection, item);
    selectNext(item);
    updateAll();
}

function expandTemplate(template, item) {
    template.contents().each(function(i, sec) {
	sec= $(sec);
	if (sec.is('ARG')) {
	    item.append(dropArea(sec.attr('type'), sec.attr('name')));
	} else if (sec.is('GROUP')) {
	    var div= $('<div/>');
	    div.addClass(sec.attr('class'));
	    div.attr('data-repeat', sec.attr('repeat'));
	    item.append(div);
	    expandTemplate(sec, div);
	} else {
	    var text= sec.text().replace(/^\s+|\s+$/g,'');
	    if (!!text) item.append(textArea(text));
	}
    });
}

function getContainer(obj) {
    if (obj.hasClass('arg')) return obj;
    return obj.parent();
}

function check_canDelete(obj) {
    return obj.hasClass('box') || 
	getContainer(obj).parent().attr('data-repeat')=='*';
}

function check_canPaste(obj) {
    return clipboard && obj.hasClass('arg') && obj.hasClass('box');
}

function check_isInBody(obj) {
    var o= getContainer(obj);
    return o.hasClass('arg') && o.parent().attr('data-repeat')=='*';
}

function check_canCopy(obj) {
    return !obj.hasClass('arg');
}

function check_canText(obj) {
    return obj.hasClass('arg') || obj.attr('data-type')=='text';
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
            submitMenu= function() { menu_edit_setValue(type, input[0].value); };
            cancel_button.click(function() { updateMenu(); });
            set_button.click(submitMenu);
        
            elt.append(input);
            elt.append(set_button);
            elt.append(cancel_button);
            
            input.focus();
    	}
    }
}

function menu_edit_setValue(type, value) {
    var selection= $('.selected');
    value= value.replace(/^\s+|\s+$/g,'');
    if (value=='') {
        if (!selection.hasClass('arg'))
	    menu_delete();
        else
            updateAll();
    } else {
	if (selection.hasClass('arg')) {
	    var div= textArea();
	    div.addClass('box');
	    div.attr('data-type', type);
	    insertBox(selection, div);
	    selection= div;
	}
	selection.text(value);
	select(selection);
	updateMenu();
    }
}

function menu_paste() {
    var clone= clipboard.clone();
    insertBox($('.selected'), clone);
    select(clone);
    updateAll();
}

function menu_copy() {
    clipboard= $('.selected').clone();
    if (clipboard.hasClass('arg')) clipboard= null;
}

function menu_delete() {
    menu_copy();
    var selection = $('.selected');
    selectNext(selection)
    var parent= selection.parent();
    releaseBox(selection);
    if (parent.hasClass('arg')) {
	select(parent);
    }
    updateAll();
}

