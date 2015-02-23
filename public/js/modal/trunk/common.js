var aceConfig_1 = ace.edit('config_1');
$('#config_1 textarea').attr('disabled', true);

var aceConfig_2 = ace.edit('config_2');
aceConfig_2.getSession().on('change', function(){
    $('textarea[name="config_2"]').val(aceConfig_2.getSession().getValue());
});

$(document).ready(function() {
    $('form[name="form-basic"]').validate({
        errorElement: 'div',
        rules: {
            'name': {
                required: true,
                regexp: regexpPattern.name_object,
                maxlength: 50
            }
        },
        messages: {
            'name': {
                required: "Please enter name",
                regexp: regexpMessage.name_object,
                maxlength: regexpMessage.max_character
            }
        }
    });
    $('input').focus(function() {
        $(this).valid();
    });
});
