/**
 * @author Sergey Volodko <s.volodko@entelnet.ru>
 * Класс работы с блоком callflow
 * @constructor
 * @param   {Object} conf конфигурация объекта
 *          {number} conf.id
 *          {string} conf.name
 *          {string} conf.desription
 *          {string} conf.macro_name
 *          {string} conf.abbr
 *          {string} conf.iconCls
 *          {string} conf.exten_name
 *          {Object} conf.structure
 */
function CallflowBlock(conf){

    CallflowBlock.superclass.constructor.apply(this, arguments);

    this.id_class = conf.id;
    this.icon = conf.iconCls;
    this.title = conf.abbr;
    this.tooltip = conf.description;
    this.name = conf.abbr;
    this.module_class = conf.name;
    this.macro_name = conf.macro_name;
    this.exten_name = conf.exten_name;
    this.structure = conf.structure || [];

    this.extens = [{apps:[]}];

    /**
     * Вызывается при двойном клике по блоку
     * @param {number} id id блока
     * @param {Object} callflow ссылка на объект callflow
     */
    this.blockAction = function(id, callflow){
        var json = callflow.find_id(id, callflow.jsonData),
            self = this;

         if ( json.property === undefined || typeof(json.property) != 'object' )
            json.property = {};
        /*
        if ( json.property.custom_name === undefined )
            json.property.custom_name = '';
        */
        var form = "";
        // Поле Custom name обязательно
        form += '<form class="form-horizontal" method="post" action="#" name="form_block" id="form_block" novalidate="novalidate">'
        form += ' <div class="control-group"> ' +
                    '<label class="control-label" for="custom_name">Name:</label> ' +
                        '<div class="controls"> ' +
                            '<input type="text" name="custom_name" id="custom_name" required placeholder="Name of block" value='+json.name+'>' +
                        '</div>' +
                  '</div> ';
        for (var i = 0,length = json.structure.length; i < length; i++) {
                form += html_field( json.structure[i] );
        }

        form += '</form>';
        showDialog(this.title + ' property', form, 600, 'auto',
            // buttons
            [{
              text: 'Cancel',
              class: "btn",
              click: function(e){
                $(this).dialog('close');
              }
            },
              {
              text: 'Confirm',
              class: "btn btn-primary",
              click: function(e){
		  var custom_name = $('#custom_name').val();

                  if ( $("#form_block").valid() ) {
                      json.name = custom_name;
                      for (var i = 0,length = json.structure.length; i < length; i++) {
                          if ( $.inArray(json.structure.field_type,['string','textarea']) ) {
                            json.structure[i].value = $('#field_' + json.structure[i].id).val().replace(/,/g,'|');
                          } else {
                            json.structure[i].value = $('#field_' + json.structure[i].id).val();
                          }
                      }
                      json.extens[0].apps = self.formApps(json);
                      callflow.update_detail(json);
                      $(this).dialog('close');
                  }
              }
             }
            ],
            // beforeopen function
            function(){
                var fieldId;
                // Выставляем list fields
                for (var i = 0,length = json.structure.length; i < length; i++) {
                    if (json.structure[i].field_type === 'list') {
                        (function(fieldId, fieldValue, default_value) {
                            var value = fieldValue ? [fieldValue] : [default_value];
                            var urlList = '/data/callflow_modules/get_list_view?view_name='+json.structure[i].list_data_view;
                            $.getJSON(urlList, function(result){
                             $('#field_' + fieldId).attr('url-list', urlList);
                             $('#field_' + fieldId).select2({multiple: false, data: result.data, width: 'element'});
                             $('#field_' + fieldId).select2('val', value);
                            });
                        })(json.structure[i].id, json.structure[i].value, json.structure[i].default_value);
                    } else if (json.structure[i].field_type === 'multilist') {
                        (function(fieldId, fieldValue, default_value) {
                            var value = fieldValue ? fieldValue.split('|') : default_value.split('|');
                            var urlList = '/data/callflow_modules/get_list_view?view_name='+json.structure[i].list_data_view;
                            
                            $.getJSON(urlList, function(result) {

                             // convert value to data for select2
                             var valueC = [];
                             $.each(value, function(index, item) {
                              var current = result.data.filter(function(el) {if (el.id == item) return el;});
                              
                              valueC.push(current.length > 0 ? current.shift() : {id: item, text: item});
                             });
                             //
                             
                             $('#field_' + fieldId).attr('url-list', urlList);
                             $('#field_' + fieldId).select2({
                                multiple: true,
                                separator: '|',
                                data: result.data,
                                width: 'element',
                                createSearchChoice:function(term, data) {
                                  if ($(data).filter(function() {
                                   return this.text.localeCompare(term) === 0;
                                  }).length === 0) {
                                   return {id:term, text:term};
                                  }
                                }
                             });

                             //$('#field_' + fieldId).select2('val', value);
                             $('#field_' + fieldId).select2('data', valueC);
                            });
                        })(json.structure[i].id, json.structure[i].value, json.structure[i].default_value);
                    } else if (json.structure[i].field_type === 'select_sound') {
                      //apply select2 to input field
                      (function(fieldId, fieldValue, default_value) {
                        var value   = fieldValue ? [fieldValue] : [default_value];
                        var urlList = '/data/callflow_modules/get_list_view?view_name=' + json.structure[i].list_data_view;
                        $.getJSON(urlList, function(result) {
                          var field = '#field_' + fieldId;
                          $(field).attr('url-list', urlList);
                          //$(field).select2({multiple: false, data: result.data, width: 'element'});
                          $(field).select2({
                            multiple: false,
                            data: result.data,
                            width: 'element'
                          });
                          $(field).select2('val', value);
                        });
                      })(json.structure[i].id, json.structure[i].value, json.structure[i].default_value);
                      //
                      
                      function getField(obj) {
                        return $(obj).closest('.control-group').find('input[type="hidden"]');
                      }
                      
                      //bind event on button + and -
                      $('#btn-show-block-upload-file').bind('click', function(event) {
                        event.preventDefault();
                        $('[id^="block-"]').hide();
                        $('#block-upload-file').show();
                      });
                      
                      $('#btn-show-block-delete-file').bind('click', function(event) {
                        event.preventDefault();
                        var field = getField(this);
                        
                        if (field.val() != 'Callout') {
                          $('[id^="block-"]').hide();
                          $('#block-delete-file').show();
                        }
                      });
                      //
                      
                      //bind event on button Yes and No
                      $('#btn-confirm-delete-file-yes').bind('click', function(event) {
                        event.preventDefault();
                        var self  = this;
                        var field = getField(this);
                        
                        $.ajax({
                          type: 'POST',
                          url: '/data/callflow_save/delete_file',
                          async: false,
                          data: {id: 'id_file'},
                          dataType: 'json',
                          success: function(data) {
                            if (data.success) {
                              if (field.length > 0) {
                                field.select2('destroy');
                                var urlList = field.attr('url-list');
                                $.getJSON(urlList, function(result) {
                                 field.select2({multiple: false, data: result.data, width: 'element'});
                                 field.select2('val', [result.data[0].id]);
                                });
                                $('#block-delete-file').hide();
                              }
                            } else alert(data.message);
                          }
                        });
                      });
                      
                      $('#btn-confirm-delete-file-no').bind('click', function(event) {
                        event.preventDefault();
                        console.info(this);
                        $('#block-delete-file').hide();
                      });
                      //
                      
                      $('input[type="file"]').bootstrapFileInput();
                      
                      $('#btn-upload').bind('click', function(event) {
                        event.preventDefault();
                        var self = this;
                        var field = getField(this);
                        
                        $.ajax({
                          type: 'POST',
                          url: '/data/callflow_save/upload_file',
                          async: false,
                          data: new FormData($(this).closest('form')[0]),
                          processData: false,
                          contentType: false,
                          dataType: 'json',
                          success: function(data) {
                            if (data.success) {
                              if (field.length > 0) {
                                field.select2('destroy');
                                var urlList = field.attr('url-list');
                                $.getJSON(urlList, function(result) {
                                 field.select2({multiple: false, data: result.data, width: 'element'});
                                 field.select2('val', [result.data[result.data.length - 1].id]);
                                });
                                $('#block-upload-file').hide();
                              }
                            } else alert(data.message);
                          }
                        });

                      });
                    }
                }
                    // Form Validation
                $("#form_block").validate({
                            rules:{
                                    required:{
                                            required:true
                                    }
                            },
                            errorClass: "help-inline",
                            errorElement: "span",
                            highlight:function(element, errorClass, validClass) {
                                    $(element).parents('.control-group').addClass('error');
                            },
                            unhighlight: function(element, errorClass, validClass) {
                                    $(element).parents('.control-group').removeClass('error');
                                    $(element).parents('.control-group').addClass('success');
                            }
                    });
            });


    }

    /**
     * Формирование html кода поля
     * @param {Object} structure Структура поля
     * @param {string} structure.field_type Тип поля string | list | multilist
     * @param {number} structure.id id поля
     * @param {string} structure.field_name имя поля
     * @param {string} structure.value значение
     * @param {number} structure.required обязательно для ввода
     * @param {string} structure.default_value значение по умолчанию
     * @param {string} structure.help_block текст подсказки
     * @returns {String}
     */
    var html_field = function(structure) {
        var html = '',
            value = structure.value ? structure.value : structure.default_value;
    
        // менем палку на запятую для текстовых полей
        if ( $.inArray(structure.field_type,['string','textarea']) ) {
            value = value.replace(/\|/g,',');
        }
        html = ' <div class="control-group"> ' +
                '<label class="control-label" for="field_' + structure.id + '">' + structure.field_name + '</label>' +
                    '<div class="controls">';
                    
        if (structure.field_type === 'select_sound') {
          html += [
            '<input type="hidden" name="field_', structure.id, '" id="field_', structure.id, '" /> ',
            '<button class="btn btn-small" title="Upload file" id="btn-show-block-upload-file"><i class="icon-plus"></i></button> ',
            '<button class="btn btn-small" title="Delete file" id="btn-show-block-delete-file"><i class="icon-minus"></i></button>',
            '<div id="block-upload-file" style="display: none;">',
              '<div style="padding: 3px 0;">',
                '<input name="file" type="file" title="Browse .wav file" class="btn btn-small" />',
              '</div>',
              '<div style="padding: 3px 0;">',
                '<input type="text" name="file_name" placeholder="Name" />',
              '</div>',
              '<div style="padding: 3px 0;">',
                '<input type="text" name="file_description" placeholder="Description" />',
              '</div>',
              '<div style="padding: 3px 0;">',
                '<button class="btn btn-primary" id="btn-upload"><i class="icon-upload icon-white"></i> Upload</button>',
              '</div>',
            '</div>',
            '<div id="block-delete-file" style="display: none; text-align: center;">',
              '<h5>Are you sure you want to delete this file?</h5>',
              '<button class="btn btn-small" id="btn-confirm-delete-file-yes">Yes</button> ',
              '<button class="btn btn-small" id="btn-confirm-delete-file-no">No</button>',
            '</div>'
          ].join('');
        } else {

          if ( structure.field_type !== 'textarea' ) {
              html += '<input type="' + (structure.field_type === 'string' ? 'text' : 'hidden' ) +
                          '" name="field_' + structure.id + '" id="field_' + structure.id + '" ' +
                          (structure.required ==  1 ? 'required':'') +
                          ' value="' + value  + '" />';
          } else {
              html += '<textarea ' +
                      ' name="field_' + structure.id + '" id="field_' + structure.id + '" ' +
                          (structure.required ==  1 ? 'required':'') +
                          '>' + value  + '</textarea>';
          }
        }
        if (structure.help_block) {
            html += '<span class="help-block">' + structure.help_block + '</span>';
        }
        html += '</div>' +
              '</div> ';
        return html;
    }

    this.blockCreate();

}

extend(CallflowBlock, baseBlock);
/*
   CallflowBlock.prototype.test = function() {
        console.log('test callflowBlock', this);
    }
*/

/**
 * Формируем контекст команды блока
 * @params {Object} data - данные блока
 * @return {Array} - массив apps
 */
CallflowBlock.prototype.formApps = function(data){
    var paramList = "'" + data.name + "'",
        value,
        apps = [],
        head_line = {};

    if (this.macro_name) {
        for (var i = 0,length = data.structure.length; i < length; i++) {
            if (data.structure[i].value) {
                value = data.structure[i].value;
            } else {
                value = '';
            }
            paramList += "," + value;
        }

        apps = [{"n": "Gosub(" + this.macro_name + "," + this.exten_name + ",1(" + paramList + "))"}]
    }
    console.log('formApps',data);
    if ($.isArray(data.list_branches) && data.list_branches.length > 0) { // если блок с ветвлением
        $.each(data.list_branches, function(index, item){
                 apps.push({"n":"GotoIF($[ ${EXITCODE} = " + item.exitcode + " ]?" + item.label + ")"});
        });
    }
    if (typeof(data.branch) === 'object') {
            head_line["n(" + data.branch.label + ")"] = "Noop(" + data.branch.name + ")";
            apps.unshift(head_line);
    }

    return apps;
}

/**
 * Метод выполняется перед дроп для юлоков с ветвлением
 * @param {callFlowChart} callflow ссылка на диаграмму
 * @param {Object} target ссылка на блок получатель
 * @param {Object} draggable ссылка на перемещаемый блок 
 * @param {Function} callback callback-функция 
 */ 
CallflowBlock.prototype.blockBeforeDrop = function(callflow, target, draggable, callback){
    var target_id = target.attr("id").split('_')[1],
        json = callflow.find_id(target_id, callflow.jsonData),
        buttons = [];

    console.log('json',json);
    if ($.isArray(json.list_branches) && json.list_branches.length > 0) {

        var find_label = function(label) {
             var is_find = false;
             if ( typeof(json.children) !== "undefined" ) {
                 $.each(json.children, function(index, item){
                     if ( item && typeof(item.branch) === 'object' && item.branch.label === label ) {
                         is_find = true;
                         return false;
                     }
                 });
             }
             return is_find;
        }

        $.each(json.list_branches, function(index, item){
                 // Проверяем наличие children branch
                 if ( !find_label(item.label) ) {
                     buttons.push({
                                    text: item.name,
                                    class: 'btn' + (item.cls !== '' ? ' btn-' + item.cls : '') ,
                                    click: function(e){
                                        var branch = {
                                            label: item.label,
                                            name: item.name
                                        };
                                        callback(target, draggable, branch);
                                        $(this).dialog("close");
                                    }
                     });
                 }
        });
        var form = "<p style='text-align:center;'>Select the branch transition</p>";
        $("#modal-dialog").html(form);
        $("#modal-dialog").dialog({
                autoOpen: true,
                title: this.title + ' selection of branches',
                modal: true,
                width: 480,
                height: 170,
                buttons: buttons,
                'open': function(event, ui) {
                    // find all the buttons - note that the 'ui' argument is an empty object
                    var buttonset = $(event.target).parent().find('.ui-dialog-buttonset');
                    buttonset.css({"width": "100%", "text-align": "center"});
                  }

        });
    } else {
        callback(target, draggable, '');
    }
}
