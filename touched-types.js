function updateTypes() {
    inferChildren($('#canvas'));
}

function inferChildren(obj, type) {
    obj.children().each(function(i, child) {
	if ($(child).is('.arg'))
	    inferArgTypes($(child));
	else
	    inferTypes($(child), type); 
    });
}

function inferArgTypes(obj) {
    var type= obj.attr('data-type');
    inferChildren(obj, type);
}

function inferTypes(obj, type, priority) {
    var mypriority= obj.attr('data-priority');
    var mytype= obj.attr('data-type');

    inferChildren(obj, type);
/*
    if (priority) {
        if (mypriority && mypriority<priority) {
            if (!(obj.prev().hasClass('paren') &&
                  obj.next().hasClass('paren'))) {
                obj.before('<div class="box-text paren">(</div>');
                obj.after('<div class="box-text paren">)</div>');
            }
        } else {
            if (obj.next().hasClass('paren')
                && obj.prev().hasClass('paren')) {
                obj.next().remove();
                obj.prev().remove();
            }
        }
    }
*/
    var error= false;
    if (type && mytype) {
	error= !type_isSuper(type, mytype);
    }
    obj.toggleClass('error', error);
}

function showTypes() {
    if ($('.showType').length>0) {
        $('.showType').remove();
    } else {
        $('.element,.arg').each( function(i, obj) {
            var type=$(obj).attr('data-type');
	    if ($(obj).is('arg')) type= '<'+type; else type='>'+type;
            if (!!type) {
                $(obj).prepend('<span class="showType">'+type+': </span>');
            }
        });
    }
}

function type_isa(obj, type) {
    if (!obj.attr('data-type')) return false;
    if (type[0]=='>')
        return type_isSuper(type.substring(1), obj.attr('data-type'));
    else
        return type_isSuper(obj.attr('data-type'), type);
}

// checks if sup is a generalization of sub
function type_isSuper(sup, sub) {
    var supl= sup.split('|');
    if (supl.length>1) {
	for (var i in supl) 
	    if (type_isSuper(supl[i], sub)) return true;
	return false;
    } else {
	var supc= sup.split('.');
	var subc= sub.split('.');
	while (true) {
            if (supc.length==0) return true;
            if (subc.length==0) return false;
            if (subc.shift()!=supc.shift()) return false;
	}
    }
}


