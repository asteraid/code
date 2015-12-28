//var itemId = eval(#{itemId});
var currentRow = {};
     
var columns = [{"mData":"id"}, {"mData":"name"}, {"mData":"pattern"}, {"mData":"comment"}];
var columnsDefs = [{"bSearchable": false, "bVisible": false, "aTargets": [0]},
    { "sWidth": "30%", "aTargets": [1] },
    { "sWidth": "40%", "aTargets": [2] },
    { "sWidth": "30%", "aTargets": [3] }];
var oTable = setDataTableTest('tblContent', '/data/items/list', columns, columnsDefs, 'rule');

$('#tblContent tr').live('dblclick', function() {openItem();});
$('#btnEdit').click(function() {openItem();});

var btns =
  [
      {
        text: "Save",
        "class": 'btn',
        click: function() {
          if($('form[name="form-basic"]').valid()) {
              var action = '';
              var data = '';
              var self = this;

              $.ajax({
                   type: 'POST',
                   url: '/data/rules/save',
                   data: $('form[name="form-basic"]').serializeArray(),
                   dataType: 'json',
                   async: false,
                   success: function(data) {
                       if(data.success) {
                           //oTable.fnReloadAjax();
                           window.location = $(location).attr('href').replace('rules', 'callflows') + '/' + data.id_rule;
                           $(self).dialog('close');
                           //changeBtnApply(1);
                       } else showDialog('Information', data.message, 'auto', 'auto');
                   }
              });
          }
        }
      }
  ];


$('#btnAdd').click(function() {
  showDialog('Add Rule', {url:'/modal/rule/add'}, '700', 'auto', btns);
});

$('#btnDelete').click(function() {
  $.ajax({
       type: 'POST',
       url: '/data/items/getparents',
       data: {item_id: currentRow.id},//$('form[name="form-basic"]').serializeArray(),
       dataType: 'json',
       async: false,
       success: function(data) {
          if(data.success) {
              var list = [];
              var btnsRule = [
                  {
                    text: "Delete",
                    "class": 'btn',
                    click: function() {
                          var self = this;

                          $.ajax({
                               type: 'POST',
                               url: '/data/rules/delete',
                               data: {item_id: currentRow.id},
                               dataType: 'json',
                               async: false,
                               success: function(data) {
                                   if(data.success) {
                                       oTable.fnReloadAjax();
                                       $(self).dialog('close');
                                       //changeBtnApply(1);
                                   } else showDialog('Information', data.message, 'auto', 'auto');
                               }
                          });
                    }
                  }, 
                  {
                    text: "Cancel",
                    "class": 'btn',
                    click: function() {
                          $(this).dialog('close');
                    }
                  }
              ];

              $.each(data.rows, function(index, el) {
                  list.push(el.parent_name);
              });

              if(list = list.join(', ')) {
                  showDialog('Information', '<p align="center">This rule included in the following contexts: <strong>' + list + '</strong>. Delete this rule?</p>', 400, 'auto', btnsRule);
              } else {
                  showDialog('Information', '<p align="center">Delete this rule?</p>', 400, 'auto', btnsRule);
              }
          }
       }
  });
});

function openItem() {
  window.location = '/callflows/' + currentRow.id;
}