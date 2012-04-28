var grammarMenu= {};
var editMenu= [
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
    });
    updateMenu();
}

function updateMenu() {
    submitMenu= undefined;
    var bar= $('#menu');
    bar.children().remove();
    fillMenu(grammarMenu, bar);
}

function fillMenu(menu, parent) {
    for (var name in menu) {
	parent.append(menuEntry(name, menu[name]));
    }
}

function menuEntry(name, submenu) {
    var li= $('<li/>');
    li.text(name);
    li.click(function() {
	var pop= li.find('.popup');
	if (pop.length>0) pop.remove();
	else {
	    if (submenu.template) insertItem(submenu.template)
	    else
		fillMenu(submenu,
			 li.append('<ul/>').find(':last').addClass('popup'));
	}
	return false;
    });
    return li;
}

function insertItem(template) {
    var selection= $('.selected');
    var item= elementArea();
    selection.replaceWith(item);
    template.contents().each(function(i, sec) {
	if (sec.nodeName=='ARG')
	    item.append(dropArea());
	else {
	    var text= $(sec).text().replace(/^\s+|\s+$/g,'');
	    if (!!text)
		item.append('<div class="box-text">'+text+'</div>');
	}
    });
    updateMenu();
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
