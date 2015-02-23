$(document).ready(function() {

  $('form').validate({
      submitHandler: function(form) {
          sendData(form);
          return false;
      },
      rules: {
          host: {
              required: true
          },
          user: {
              required: true
          },
          db_config: {
              required: true,
          },
          file_config: {
              required: true
          }
      },
      messages: {}
  });
  
  function sendData(form) {
      spinStart();

      $.ajax({
          type: 'POST',
          url: '/data/install/create',
          //data: $(form).serialize(),
          data: new FormData(form),
          processData: false,
          contentType: false,

          dataType: 'json',
          //async: false,
          async: true,
          success: function(data) {
              spinStop();

              if(data.success)
                  window.location.href = '/';
              else {
                  if(data.match) {
                      var buttons = [
                          {
                              text: 'Cancel',
                              "class": 'btn',
                              click: function() {
                                  $(this).dialog("close");
                              }
                          },
                          {
                              text: 'OK',
                              "class": 'btn',
                              click: function() {
                                  $('input[name="overwrite"]').val(1);
                                  sendData(form);
                                  $(this).dialog("close");
                              }
                          }
                      ];
                      showDialog('Warning!', data.message, 'auto', 'auto', buttons);
                  } else showDialog('Information', data.message, 'auto', 'auto');
              }
          }
      });
  }
});