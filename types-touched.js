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
            var error= (type != obj.attr('data-type'));
            obj.toggleClass('error', error)
        }
	}
}