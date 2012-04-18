function updateTypes() {
    inferTypes($('#canvas'),['cmd']);
}

function inferTypes(obj, types, priority) {
    if (!obj.attr)
	return;

    var mypriority= obj.attr('data-priority');
    var subtypes= obj.attr('data-arg-types') || 'cmd';
    subtypes= subtypes.split(' ');

    obj.children().each( function() { 
	    inferTypes($(this), subtypes, mypriority); 
	});

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

 	if (obj.hasClass('box') &&! obj.hasClass('float')) {
	    var type= types[0];
        if (types[1]) types.shift(); 
        if (obj.hasClass('arg')) {
	        obj.attr('data-type', type);
        } else {
            var obj_type= obj.attr('data-type');
            if (type!='ident' && obj_type=='ident') {
                obj_type= 'var-use';
                obj.attr('data-type', obj_type);
            }
            var error= !type_isSuper(type, obj_type);
            obj.toggleClass('error', error);
        }
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
    if (sub=='var-use') return type_isSuper('exp',sup);
    var supc= sup.split('.');
    var subc= sub.split('.');
    while (true) {
        if (supc.length==0) return true;
        if (subc.length==0) return false;
        if (subc.shift()!=supc.shift()) return false;
    }
}


