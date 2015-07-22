var currentRow    = {};
var templateJSON  = {};

var columns = [
  {"mData": "id"},
  {"mData": "name"},
  {"mData": "custom_type"},
  {"mData": "comment"},
  {"mData":"commented"}
];
var columnsDefs = [{"bSearchable": false, "bVisible": false, "aTargets": [0]}];
var oTable = setDataTableTest('tblTrunks', '/data/items/list', columns, columnsDefs, 'trunk');

var btnsAddTrunk = [
  {
    text: "Save",
    "class": 'btn',
    click: function() {
      if($('form[name="form-basic"]').valid()) {
          var action = '';
          var data = '';
          var modalId = '#modal-dialog';

          action = '/data/trunks/save_trunk';

          textConfig_1 = getConfig('form[name="form-basic"], form[name="form-advanced"]');
          textConfig_2 = $('textarea[name="config_2"]').val();

          configSeparator = 'separator=';

          if(textConfig_2 == '')
              arrConfig = splitTextarea(textConfig_1);
          else
              arrConfig = splitTextarea(textConfig_1).concat(configSeparator).concat(splitTextarea(textConfig_2));

          var arrConfigRes = [];
          var fieldForm = [];
          var nameTrunk = '';
          var commentTrunk = '';
          var idTrunk = 0;
          var actionTrunk = 'create';
          var p = '', v = '';

          //находим имя и удаляем его из массива, перед этим присваиваем его переменной
          $.each(arrConfig, function(index, el) {
               if(match = el.match(/\[(.*)\]/))
                  nameTrunk = match[1];
               else
                  arrConfigRes.push(el);
          });

          commentTrunk = $('textarea[name="comment"]').val();
          fieldForm.custom_type   = $('input[name="custom_type"]').val();
          fieldForm.commented     = $('input[name="commented"]').val();
          fieldForm.node          = $('input[name="node"]').val();

          //разбираем массив и записываем в 2 переменных параметры - p, и значения - v
          $.each(arrConfigRes, function(index, el){
              arrEl = el.split('=');
              p += arrEl[0] + ';';
              v += arrEl[1] + ';';
          });

          //удаляем лишнюю ";" в конце строк
          p = p.slice(0, -1);
          v = v.slice(0, -1);

          if($('input[name="id"]').val()) {
              idTrunk = $('input[name="id"]').val();
              actionTrunk = 'edit';
          }

          var self = this;

          $.ajax({
               type: 'POST',
               url: action,
               data: {
                  params: p,
                  values: v,
                  name: nameTrunk,
                  comment: commentTrunk,
                  action: actionTrunk,
                  id: idTrunk,
                  node: fieldForm.node,
                  custom_type:fieldForm.custom_type,
                  commented: fieldForm.commented},
               dataType: 'json',
               async: false,
               success: function(data) {
                   if(data.success) {
                       oTable.fnReloadAjax();
                       $(self).dialog('close');
                       changeBtnApply(1);
                   } else showDialog('Information', '<p align="center">'+data.message+'</p>', 'auto', 'auto');
               }
          });
      }
    }
  }
];

$('#tblTrunks tr').live('dblclick', function() {
    editItem();
});

$('#btnAddTrunk').click(function() {
    var btns = [
      {
        text: "Next",
        "class": 'btn',
        click: function() {
          var trunk_type = $('select[name="trunk_type"]').val();
          $(this).dialog('close');
          if(trunk_type == 'SIP')
              showDialog('Add Trunk Type "SIP"', {url:'/modal/trunk/add_SIP'}, '700', '550', btnsAddTrunk);
          if(trunk_type == 'H323')
              showDialog('Add Trunk Type "H323"', {url:'/modal/trunk/add_H323'}, '700', '550', btnsAddTrunk);
          if(trunk_type == 'IAX')
              showDialog('Add Trunk Type "IAX"', {url:'/modal/trunk/add_IAX'}, '700', '550', btnsAddTrunk);
        }
      }
    ];

    showDialog('Choose type trunk', {url:'/modal/trunk/add_type'}, '700', '200', btns);
});

$('#btnEditTrunk').click(function() {editItem();});

function editItem() {
    if(currentRow.custom_type == 'SIP')
        showDialog('Edit Trunk Type "SIP"', {url:'/modal/trunk/edit_SIP'}, '700', '550', btnsAddTrunk);
    if(currentRow.custom_type == 'OOH323')
        showDialog('Edit Trunk Type "OOH323"', {url:'/modal/trunk/edit_H323'}, '700', '550', btnsAddTrunk);
    if(currentRow.custom_type == 'IAX2')
        showDialog('Edit Trunk Type "IAX2"', {url:'/modal/trunk/edit_IAX'}, '700', '550', btnsAddTrunk);
}

$('#btnDeleteTrunk').click(function() {
    var btnsDelete = [
      {
          text: 'Ok',
          "class": 'btn btn-primary',
          click: function() {
              $(this).dialog('close');
              $.ajax({
                  type: 'POST',
                  url: '/data/trunks/delete_trunk',
                  data: {id: currentRow.id, name: currentRow.name},
                  dataType: 'json',
                  async: false,
                  success: function(data) {
                      if(data.success) {
                          oTable.fnReloadAjax();
                          $('#btnEditTemplate, #btnDeleteTemplate').attr('disabled', true);
                          changeBtnApply(1);
                      } else showDialog('Information', '<p align="center">'+data.message+'</p>', 'auto', 'auto');
                  }
              });
          }
      },
      {
          text: 'Cancel',
          "class": 'btn btn-primary',
          click: function() {
              $(this).dialog('close');
          }
      }
    ];

    /*$.ajax({
        type: 'POST',
        url: '/data/trunks/get_itemid',
        data: {item_name: currentRow.name},
        dataType: 'json',
        async: false,
        success: function(data) {
          if(data.success) {
              if(data.rows[0] !== undefined && data.rows[0].item_id) {
                $.ajax({
                  type: 'POST',
                  url: '/data/items/getparents',
                  data: {item_id: data.rows[0].item_id},
                  dataType: 'json',
                  async: false,
                  success: function(data) {
                      var list = [];
                      $.each(data.rows, function(index, el) {
                          list.push(el.name);
                      });

                      showDialog('Information', '<p align="center">This trunk can\'t be deleted. It included in the following callflows: <strong>' + list + '</strong>', 400, 'auto');
                  }
                });
              } else {
                  showDialog('Information', '<p align="center">Delete this trunk?</p>', 'auto', 'auto', btnsDelete);
              }
          } else {
              showDialog('Error', '<p align="center">' + data.message + '</p>', 'auto', 'auto');
          }
        }
    });*/
    
    if (currentRow.id) {
      $.ajax({
        type: 'POST',
        url: '/data/items/getparents',
        data: {item_id: currentRow.id},
        dataType: 'json',
        async: false,
        success: function(data) {
          var list = [];
          $.each(data.rows, function(index, el) {
            if (el.parent_id)
              list.push(el.name);
          });

          if (list.length > 0)
            showDialog('Information', '<p align="center">This trunk can\'t be deleted. It included in the following callflows: <strong>' + list + '</strong>', 400, 'auto');
          else
            showDialog('Information', '<p align="center">Delete this trunk?</p>', 'auto', 'auto', btnsDelete);
        }
      });
    }
});