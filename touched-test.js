$(init);
function init() {
    $('tests test').each(function(index, data){
        var name = $(data).attr('name');
        $("#testChoice").append("<input type='button' onclick='runTest(\""+name+"\")' value='run "+name+"' />");
});
}

function runTest(name) {
    $('#testChoice').hide();
    $('#rund3').hide();
    var data= $('tests test[name="'+name+'"]');
    var testData = $(data).text();
    var array = testData.split("}");
    stepThroughTest(array, 0);
}

function stepThroughTest(array, num) {
    if (num < array.length - 1) {
        var res = eval("(" + array[num] + "})");
        var e = jQuery.Event("keydown");
        e.keyCode = res.keyCode;
        e.which = res.keyCode;
        e.ctrlKey = res.isCtrl;
        e.shiftKey = res.isShift;
        if (res.target == '#input') {
            var oldvalue = $('#input').attr('value');
            if (res.keyCode == 8) {
                $('#input').attr('value', oldvalue.replace(/.$/,''));
            } else {
                var newvalue = String.fromCharCode(res.keyCode);
                if (!e.shiftKey) newvalue = newvalue.toLowerCase();
                $('#input').attr('value', oldvalue + newvalue);
            }
        }
        $(res.target).trigger(e);
        if (res.target != '#input') setTimeout(function() {
            stepThroughTest(array, num + 1)
        }, 200);
        else stepThroughTest(array, num + 1);
    }
}

var record;
function recordTest() {
    record="";
    $('#testChoice').hide();
    $('#rund3').hide();
    $('body').keydown(function(evt) {
        var target= evt.target.nodeName;
        if ($(evt.target).attr('id'))
            target= '#'+$(evt.target).attr('id');
        var eventStr= '{target:"'+target+'", keyCode:'+evt.which+', isCtrl:'+evt.ctrlKey+', isShift:'+evt.shiftKey+'}<br/>';
        record= record+eventStr;
    });
    var finish= $('<input type="button" value="STOP"/>');
    $('body').append(finish);
    finish.click(function() {
        document.write(record);
    });
}

