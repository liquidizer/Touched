function updateTypes() {
    inferTypes($('#canvas'));
}

function inferTypes(obj, types) {
    if (!obj.attr)
	return;

    var subtypes= obj.attr('data-arg-types') || '';
    subtypes= subtypes.split(' ');

    obj.children().each( function() { 
	    inferTypes($(this), subtypes); 
	});

 	if (obj.hasClass('box')) {
	    var type= types.shift() || 'cmd';
        if (obj.hasClass('arg')) {
	        obj.attr('data-type', type);
        } else {
            var obj_type= obj.attr('data-type');
            if (type!='ident' && obj_type=='ident') {
                obj_type= 'var-use';
                obj.attr('data-type', obj_type);
            }
            var error= !type.match(type_pattern(obj_type));
            error= error &&! obj.hasClass('float');
            obj.toggleClass('error', error);
        }
	}
}

function type_pattern(type) {
    if (type=='var-use') return (/exp.*/);
    type= type.replace(/([a-z]+)\.(.*)/,'$1(\\.$2)?');
    type= type.replace(/([a-z]+)\.(.*)/,'$1(\\.$2)?');
    return new RegExp('^'+type+'$');
}
