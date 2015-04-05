var contextsList  = getContextsList('all');
var templatesList = getTemplatesList();

select2Input('input[name="context"]', {data: contextsList}, false, false);
select2Input('input[name="template"]', {data: templatesList}, false, false);

$('input[name="ids"]').val(oTable.getCheckedItemsData('extid').join(','));
$('#extensions-info').html(oTable.getCheckedItemsData('extension').join(', '));
//fill form
//fillFormSimple('/data/extensions/load_ext', currentRow.extid);

$(document).ready(function() {
  $("#form-main").validate({
      rules: {
        template: {
          required: true
        },
        context: {
          required: true
        }
      },
      messages: {}
  });
});