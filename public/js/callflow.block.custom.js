/**
 * Блок custom
 * @class CustomBlock
 * @extends CallflowBlock
 */
function CustomBlock(conf) {
    // Вызываем конструктор родительского класса
    CustomBlock.superclass.constructor.apply(this, arguments);

    // метод вызывается при двойном клике по блоку
    this.blockAction = function(id, callflow){
         var json = callflow.find_id(id, callflow.jsonData),
             apps = json.extens[0].apps;

         if ( typeof(json.property) == 'undefined' || typeof(json.property) != 'object' )
            json.property = {};


        var form = '';
        form += ' <div class="control-group"> \
                    <label class="control-label" for="custom_name">Custom Name</label> \
                        <div class="controls"> \
                            <input type="text" name="custom_name" id="custom_name" placeholder="Custom name of block"  value='+json.name+'> \
                        </div> \
                  </div> ';
        form += ' <div class="control-group"> \
                             <div id="custom_config" style="width: 100%; height: 200px;"></div>\
                  </div> ';
//        form += ' <div class="control-group"> \
//                    <label class="control-label" for="custom_config">Custom config</label> \
//                        <div class="controls"> \
//                             <div id="custom_config" style="width: 100%; height: 200px;"></div>\
//                        </div> \
//                  </div> ';

        modalShow('Custom property',form, function(){
                //var condition_var_name = $('#condition_var_name').attr('value');
                var custom_name = $('#custom_name').val();
                json.name = custom_name;
                $('#node_'+json.id).find('.details').html(custom_name);
                var config = ace.edit('custom_config').getValue();
                json.extens = configToExtens(config).slice(0);
       },
       function(){
           var custom_conf = ace.edit('custom_config');
           var text_config = extensToConfig(json.extens,'txt');
           custom_conf.setValue(text_config);
       }
       );
    }

    /**
     * Формируем контекст команды блока
     * @params {Object} data - данные блока
     * @return {Array} - массив apps
     */
    this.formApps = function(data){
        var apps ;

        apps = CustomBlock.superclass.formApps.call(this, data);

        apps.push(data.extens[0].apps);

        return apps;
    }

}

// наследуем от CallflowBlock
extend(CustomBlock, CallflowBlock);
