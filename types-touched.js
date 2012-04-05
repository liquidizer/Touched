function updateTypes() {
    inferTypes($('#canvas'));
}

function inferTypes(obj, types) {
    if (!obj.attr)
	return;

    var subtypes= obj.attr('data-arg-types');
    if (subtypes) {
	subtypes= subtypes.split(' ');
    }

    obj.children().each( function() { 
	    inferTypes($(this), subtypes); 
	});

    while (obj.length>0) {
	if (obj.hasClass('box')) {
	    if (obj.hasClass('arg')) {
		if (types) {
		    var type= types.shift();
		    obj.attr('data-type', type);
		} else {
		    obj.attr('data-type', 'cmd');
		}
	    }
	}
	obj= obj.next();
    }
}