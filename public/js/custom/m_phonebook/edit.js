var $form     = $('form[name="module_phonebook"]');
var $inputId  = $('input[name="id"]');

$('input[name="update"]').spinner({max: 3600, min: 1});

updateForm();


function getFNames(header, rows) {
  var data = [];
  if (header && header.length > 0)
    data = header;
    
  if (data.length === 0 && rows.length > 0)
    data = rows[0].map(function(item) {return '';});
    
  return data;
}

function getFValues(rows) {
  var data = [];
  if (rows && rows.length > 0)
    data = rows[0];
  
  return data;
}

function updateForm() {
  var item = getCurrentItem();
  
  if (item.id) {
    $.each(item, function(name, value) {
      var field = $('[name="' + name + '"]');
      
      if (field.is(':checkbox')) {
        field.prop('checked', value);
        $('input[type=checkbox]').uniform();
      } else
        field.val(value);
        
      getPreview($inputId.val());
    });
  } else
    $('input[type=checkbox]').uniform();
}

$('input[name="header"]').on('click', function(event) {
  getPreview($inputId.val());
});

$('#csv-download').on('click', function(event) {
  event.preventDefault();
  
  $.ajax({
    type: 'GET',
    url: '/data/module_phonebook/download',
    data: {url: $('input[name="url"]').val()},
    dataType: 'json',
    async: false,
    success: function(data) {
      if (data.success) {
        $inputId.val(data.id);
        getPreview(data.id);
      } else {
        showDialog('Information', data.error.message, '300', 'auto');
      }
    }
  });
  
});

function getPreview(id) {
  var html = [
    '<div class="control-group">',
      '<label class="control-label">Values</label>',
      '<div class="controls">',
        '<table class="table table-bordered table-striped table-hover">',
          '<thead>',
            '<tr>',
              '<th>Field name</th>',
              '<th>Field value</th>',
              '<th>Show</th>',
            '</tr>',
          '</thead>',
          '<tbody>',
          '</tbody>',
        '</table>',
      '</div>',
    '</div>'
  ].join('');
  
  $.ajax({
    type: 'GET',
    url: '/data/module_phonebook/preview',
    data: {id: id, header: $form.find('input[name="header"]').attr('checked')},
    dataType: 'json',
    async: false,
    success: function(data) {
      if (data.success) {
        var names   = getFNames(data.header, data.rows);
        var values  = getFValues(data.rows);
        var columns = data.columns;
        var result  = [];
        
        names.forEach(function(item, index) {
          var column = columns[index];
          
          if (!column)
            column = {id: '', show: ''};
          
          if (column.show == 1)
            column.show = 'checked';
            
          result.push([
            '<tr>',
              '<td>',
                '<input type="hidden" name="fields[' + index + '][id]" value="' + column.id + '" />',
                '<input type="text" name="fields[' + index + '][name]" value="' + (column.name !== undefined ? column.name : item) + '" />',
              '</td>',
              '<td>' + values[index] + '</td>',
              '<td>',
                '<input type="checkbox" name="fields[' + index + '][show]" ' + column.show + '/>',
              '</td>',
            '</tr>'
          ].join(''));
        });
        
        var block = $('#module-phonebook-csv-values');
        block
          .html(html)
          .find('tbody').append(result.join(''))
          .find('input[type="checkbox"]').uniform();
      }
    }
  });
}

$('form[name="module_phonebook"]').validate({
  submitHandler: function(form) {
    $.ajax({
      type: 'POST',
      url: $(form).attr('action'),
      data: $(form).serialize(),
      dataType: 'json',
      async: false,
      success: function(data) {
        if (data.success) {
          getPreview($inputId.val());
          showDialog('Information', data.message, '300', 'auto');
        } else
          showDialog('Information', data.error.message, '300', 'auto');
      }
    });
    
    return false;
  }
});