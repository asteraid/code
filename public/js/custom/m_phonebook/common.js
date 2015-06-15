function getCurrentItem() {
  var result = {};
  
  $.ajax({
    type: 'GET',
    url: '/data/module_phonebook/get_current_item',
    dataType: 'json',
    async: false,
    success: function(data) {
      if (data.success)
        if (data.results.length > 0)
          data.results.forEach(function(item) {
            result.id = item.item_id;
            result[item.name] = item.value;
          });        
    }
  });
  
  return result;
}