$(document).ready(function() {
  $('form[name="change_password"]').validate({
      submitHandler: function(form) {
          $.ajax({
              type: 'POST',
              url: $(form).attr('action'),
              data: $(form).serialize(),
              dataType: 'json',
              async: false,
              success: function(data) {
                  if(data.success !== undefined)
                      modal({
                        title: 'Information',
                        body: '<p align="center">'+data.message+'</p>',
                        width: '300',
                        height: 'auto'
                      });
                      
              }
          });
          
          return false;
      },
      rules: {
          password_o: {
              required: true,
              remote: {
                  type: 'POST',
                  url: '/data/password/check_password'
              }
          },
          password_n1: {
              required: true,
              minlength: 4
          },
          password_n2: {
              required: true,
              minlength: 4,
              equalTo: 'input[name="password_n1"]'
          },
      },
      messages: {}
  });
});