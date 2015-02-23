/**
 * Unicorn Admin Template
 * Diablo9983 -> diablo9983@gmail.com
**/
$(document).ready(function(){

	var login = $('#loginform');
	var recover = $('#recoverform');
	var speed = 400;

	$('#to-recover').click(function(){
		login.fadeTo(speed,0.01).css('z-index','100');
		recover.fadeTo(speed,1).css('z-index','200');
	});

	$('#to-login').click(function(){
		recover.fadeTo(speed,0.01).css('z-index','100');
		login.fadeTo(speed,1).css('z-index','200');
	});
        
       // Обработка формы
        $('#loginform').on('submit', function(e){
            e.preventDefault();
            var formData = $(this).serialize();
            console.log('formData=',formData);
        
            $.post('data/auth/login', formData, function(response){
                // выведем в лог данные, полученные от сервера
                //console.log('response',response);
                if ( response.success ){
                    $('#message').prepend('<div class="alert alert-success">\
                    <button type="button" class="close" data-dismiss="alert">&times;</button>\
                    <strong>Authorization!</strong> Success. </div>');
                    window.location.href = '/';
                }
                else {
                    $('#message').prepend('<div class="alert alert-error">\
                    <button type="button" class="close" data-dismiss="alert">&times;</button>\
                    <strong>Authorization!</strong> Error login or password. </div>');
                    $('#loginform')[0].reset();
                }
                    
            });
            // отменим стандартный сабмит формы
            return false;
        });
    
    if($.browser.msie == true && $.browser.version.slice(0,3) < 10) {
        $('input[placeholder]').each(function(){ 
       
        var input = $(this);       
       
        $(input).val(input.attr('placeholder'));
               
        $(input).focus(function(){
             if (input.val() == input.attr('placeholder')) {
                 input.val('');
             }
        });
       
        $(input).blur(function(){
            if (input.val() == '' || input.val() == input.attr('placeholder')) {
                input.val(input.attr('placeholder'));
            }
        });
    });

        
        
    }
});