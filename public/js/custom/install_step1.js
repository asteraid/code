$(document).ready(function() {
  //default
  setValues(default_values, 'default');
  spinStop();

  $('form').validate({
    submitHandler: function(form) {
      sendData(form);
      return false;
    },
    rules: rules,
    messages: {
        db_cdr: {
            notEqual: 'Input the different name (not "Database name (configuration)")'
        }
    }
  });
  
  function setValues(data, type) {
      $.each($('input'), function(index, el) {
          var curr_name = $(el).attr('name');
          if(data[curr_name] && type == 'default')
              $(el).val(data[curr_name]);
          else if(data[curr_name] && type != 'default')
              $(el).val('');
      });
  }
  
  function sendData(form) {
      spinStart();

      $.ajax({
          type: 'GET',
          url: '/data/install/create',
          data: $(form).serialize(),
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