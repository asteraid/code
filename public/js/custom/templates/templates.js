var currentRow = {};
var templateJSON = {};
//var modal = '';

var columns = [{"mData":"id"}, {"mData":"name"}, {"mData":"comment"}];
var columnsDefs = [{"bSearchable": false, "bVisible": false, "aTargets": [0]}];
var oTable = setDataTableTest('tblContent', "/data/templates/list", columns, columnsDefs, 'template');

var btns = [
      {
        text: "Save",
        "class": 'btn',
        click: function() {
          if($('form[name="form-basic"]').valid()) {
              var action = '/data/templates/save';
              var data = '';
              var modalId = '#modal-dialog';

              textConfig_1 = getConfig('form[name="form-basic"], form[name="form-advanced"]');
              textConfig_2 = $('textarea[name="config_2"]').val();

              configSeparator = 'separator=';

              if(textConfig_2 == '')
                  arrConfig = splitTextarea(textConfig_1);
              else
                  arrConfig = splitTextarea(textConfig_1).concat(configSeparator).concat(splitTextarea(textConfig_2));

              var arrConfigRes = [];
              var nameTemplate = '';
              var commentTemplate = '';
              var idTemplate = 0;
              var actionTemplate = 'create';
              var p = '', v = '';

              //находим имя и удаляем его из массива, перед этим присваиваем его переменной
              $.each(arrConfig, function(index, el) {
                   if(match = el.match(/\[(.*)\]/))
                      nameTemplate = match[1];
                   else
                      arrConfigRes.push(el);
              });

              commentTemplate = $('textarea[name="comment"]').val();

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
                  idTemplate = $('input[name="id"]').val();
                  actionTemplate = 'edit';
              }

              var self = this;
              $.ajax({
                   type: 'POST',
                   url: action,
                   data: {params: p, values: v, name: nameTemplate, comment: commentTemplate, action: actionTemplate, id: idTemplate},
                   dataType: 'json',
                   async: false,
                   success: function(data) {
                       if(data.success) {
                           oTable.fnReloadAjax();
                           $(self).dialog('destroy');
                           changeBtnApply(1);
                       } else
                        modal({
                          title: 'Information',
                          body: data.message,
                          width: 'auto',
                          height: 'auto'
                        });
                   }
              });
              setButtonsState('tblContent');
          }
      }
  }
];

$('#tblContent tr').live('dblclick', function() {
    modal({
      title: 'Edit Template',
      body: {url:'/modal/template/edit'},
      width: '700',
      height: 'auto',
      buttons: btns
    });
});

$('#btnAdd').on('click', function() {
    modal({
      title: 'Add Template',
      body: {url:'/modal/template/add'},
      width: '700',
      height: 'auto',
      buttons: btns
    });
});

$('#btnEdit').on('click', function() {
    modal({
      title: 'Edit Template',
      body: {url:'/modal/template/edit'},
      width: '700',
      height: 'auto',
      buttons: btns
    });
});

$('#btnDelete').on('click', function() {
    var btnsDelete =
        [
            {
                text: 'Ok',
                "class": 'btn btn-primary',
                click: function() {
                    $(this).dialog('destroy');
                    $.ajax({
                        type: 'POST',
                        url: '/data/templates/delete',
                        data: {id: currentRow.id, name: currentRow.name},
                        dataType: 'json',
                        async: false,
                        success: function(data) {
                            if(data.success) {
                                oTable.fnReloadAjax();
                                $('#btnEdit, #btnDelete').attr('disabled', true);
                                changeBtnApply(1);
                            } else
                              modal({
                                title: 'Information',
                                body: data.message,
                                width: 'auto',
                                height: 'auto'
                              });
                        }
                    });
                }
            },
            {
                text: 'Cancel',
                "class": 'btn btn-primary',
                click: function() {
                    $(this).dialog('destroy');
                }
            }
        ];

    //showDialog('Information', '<p align="center">Delete this template?</p>', 'auto', 'auto', btnsDelete);
    modal({
      title: 'Information',
      body: '<p align="center">Delete this template?</p>',
      width: 'auto',
      height: 'auto',
      buttons: btnsDelete
    });
});