$(init);
function init() {
    $('tests test').each(function(index, data){
        var name = $(data).attr('name');
        $("#testChoice").append("<input type='button' onclick='runTest(\""+name+"\")' value='run "+name+"' />");
});
}


function runTest(name) {
    console.log(name);
    $('#testChoice').hide();
    var data= $('tests test[name="'+name+'"]');
    var testData = $(data).text();
    var array = testData.split("}");
    stepThroughTest(array, 0);
}

function stepThroughTest(array, num) {
    if (num < array.length - 1) {
        // execute data[index]
        var res = eval("(" + array[num] + "})");
        var e = jQuery.Event("keydown");
        e.keyCode = res.keyCode;
        e.which = res.keyCode;
        e.ctrlKey = res.isCtrl;
        e.shiftKey = res.isShift;
        if (res.target == '#input') {
            if (res.keyCode > 64 && res.keyCode < 91) {
                var oldvalue = $('#input').attr('value');
                var newvalue = String.fromCharCode(res.keyCode);
                if (!e.shiftKey) newvalue = newvalue.toLowerCase();
                $('#input').attr('value', oldvalue + newvalue);
            }
        }
        $(res.target).trigger(e);
        setTimeout(function() {
            stepThroughTest(array, num + 1)
        }, 200);
    }
}

var record;
function recordTest() {
    record="";
    $('#testChoice').hide();
    console.log('this function is only called once');
    // replace with new keypress handler that records and the calls the original  
    $('body').keydown(function(evt) {
        //console.log('this function is called with every keypress.');
        //console.log(evt.target.nodeName);
        var target= evt.target.nodeName;
        if ($(evt.target).attr('id'))
            target= '#'+$(evt.target).attr('id');
        //console.log(evt.ctrlKey);
        //record events
        //var oldValue=$('#testrecord').val(); 
        var eventStr= '{target:"'+target+'", keyCode:'+evt.which+', isCtrl:'+evt.ctrlKey+', isShift:'+evt.shiftKey+'}<br/>';
        record= record+eventStr;
        //$('#testrecord').val(oldValue+eventStr);
    });
    var finish= $('<input type="button" value="STOP"/>');
    $('body').append(finish);
    finish.click(function() {
        document.write(record);
    });
}

