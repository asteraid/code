$(document).ready(function() {
    $('input').focus(function() {
        if(!$(this).hasClass('select2-input'))
            $(this).valid();
    });
});