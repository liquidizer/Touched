function updateTypes(canvas) {
    inferChildren(canvas);
    implementArguments($(canvas), false);
}

function inferChildren(obj, type) {
    obj.children().each(function(i, child) {
	if ($(child).is('.arg'))
	    inferChildren($(child), $(child).attr('data-type'));
	else
	    inferTypes($(child), type); 
    });
}

// Test implementation for the programming domain
function implementArguments(obj, argType) {
    if (obj.is('.arg') && obj.attr('data-type')!="prog.withParam") {
	obj.attr('data-type', obj.attr('data-type').replace(/\|prog.arg/,''));
	if (argType)
	    obj.attr('data-type',obj.attr('data-type')+'|prog.arg');
    }
    if (obj.attr('data-type')=='prog.arg') argType= false;
    if (obj.attr('data-type')=='prog.function') {
	obj.children().each(function(i,child) {
	    implementArguments($(child), true);
	});
    } else {
	obj.children().each(function(i,child) {
	    implementArguments($(child), argType);
	});
    }
}

function inferArgTypes(obj) {
}

function inferTypes(obj, type, priority) {
    var mypriority= obj.attr('data-priority');
    var mytype= obj.attr('data-type');

    inferChildren(obj, type);
    var error= false;
    if (type && mytype) {
	error= !type_isSuper(type, mytype);
    }
    obj.toggleClass('error', error);
}

// check if obj is an object of type
function type_isa(obj, type) {
    if (!obj.attr('data-type')) return false;
    if (type[0]=='>')
        return type_isSuper(type.substring(1), obj.attr('data-type'));
    else
        return type_isSuper(obj.attr('data-type'), type);
}

// checks if sup is a generalization of sub
function type_isSuper(sup, sub) {
    //console.log (sup + ' <- ' + sub +'?');
    if (sup=='*') return true;
    var supl= sup.split('|');
    var subl= sub.split('|');
    if (supl.length>1) {
	for (var i=0;i<supl.length;i++)
	    if (type_isSuper(supl[i], sub)) return true;
	return false;
    } else if (subl.length>1) {
	for (var i=0;i<subl.length;i++)
	    if (type_isSuper(sup, subl[i])) return true;
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

// unify two types
function type_unify(type1, type2) {
    var type='';
    var list1= type1.split('.');
    var list2= type2.split('.');
    while (true) {
	if (list1.length==0 || list1[0]!=list2[0])
	    return type;
	if (type.length>0) type= type+'.';
	type=type+list1[0];
	list1.shift();
	list2.shift();
    }
}
