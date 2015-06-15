function getData(id) {
  var result = {};
  
  $.ajax({
    type: 'GET',
    url: '/data/module_phonebook/get_contacts',
    data: {id: id},
    dataType: 'json',
    async: false,
    success: function(data) {
      if (data.success)
        result = data;
    }
  });
  
  return result;
}

function convertValues(data) {
  var values = [];
  
  data.forEach(function(item) {
    if (item) {
      var value = [];
      item.forEach(function(el) {
        //value[el.name] = el.value;
        value.push(el.value);
      });
      values.push(value);
    }
  });
  
  return values;
}

var itemId  = getCurrentItem().id;
var data    = getData(itemId);
var values  = convertValues(data.data);

$('#table-block').html('<table cellpadding="0" cellspacing="0" border="0" class="display table table-bordered table-striped table-hover" id="tblContent"></table>');
$('#tblContent').dataTable({
  "bLengthChange": false,
  "iDisplayLength" : 50,
  "data": values,
  "columns": data.columns.map(function(item) {return {title: item};})
});