/**
 * Функция для реализации правильного наследования классов
 * http://javascript.ru/tutorial/object/inheritance#nasledovanie-na-klassah-funkciya-extend
 */
function extend(Child, Parent) {
	var F = function() {};
	F.prototype = Parent.prototype;
	Child.prototype = new F();
	Child.prototype.constructor = Child;
	Child.superclass = Parent.prototype;
}


/**
 * Класс для формирования блоков боковой панели
 * 
 */
function baseBlock() {
    this.box = $('#item-switcher .item-box');
    
    this.icon = '';
    
    this.title = '';
    
    this.tooltip = '';
    
    this.name = '';

    this.module_class = '';
    
    this.id_class = null;

    this.extens = '';
    
    this.property = {};
    
    this.callflow_type = 'callflow';
    
    this.parent = null;
    
    // Метод выполняется после delete child item
    this.blockAfterChildDel = function(id, callflow, node_data ){
        var json = callflow.find_id(id, callflow.jsonData) ;
	var entry_point = "${EXTEN}";
        if ( json.module_class == 'root' ) { // для рута удаляем из всех копий
            for ( var i = 0, length = json.extens.length; i< length; i++ ){
		    callflow.drop_gosub(json.extens[0].apps,"Gosub("+node_data.module_class+","+node_data.id+",1)");
            }
        } 
        else { 
		callflow.drop_gosub(json.extens[0].apps,"Gosub("+node_data.module_class+","+node_data.id+",1)");
	}
    }    
    
    this.blockCreate = function(){
        var html = '<div class="item tip-left" title="'+this.tooltip+'">';
        html += '<div class="item-content"> <i class="icon-white '+this.icon+'"></i>';
        html += '<span>'+this.title+'</span>';
        html += '</div></div>';
        this.cmp = $(html).appendTo(this.box);
        
        this.cmp.draggable({
                        appendTo: '#callflow'
                        ,helper: 'clone'
                        ,cursor: 'move'
                        ,scroll: false
                        ,zIndex: 100
                    });
        this.cmp.data({ module_data: {
                                       name: this.name,
                                       title: this.title,
                                       module_icon: this.icon,
                                       detail: this.title,
                                       module_class: this.module_class,
                                       id_class: this.id_class,
                                       extens: this.extens,
                                       property: this.property,
				       callflow_type: this.callflow_type,
                                       macro_name: this.macro_name,
				       parent: this.parent,
                                       structure: this.structure
                                      }
        });
    }

    this.test = function() {
        console.log('test callflowBlock', this);
    }
}

    /**
     * Выполняется после drop блока
     * Прописывает содержимое контекста в родительском блоке (руте)
     * @param {type} id - id блока на который натаскиваем блок
     * @param {type} callflow - ссылка на объект callflow
     * @param {type} json_source - данные натаскиваемого блока
     * @returns {undefined}
     *
     * @this блок на который натаскиваем объект
     *
     * TODO: callflow получать при создании объекта
     */
    baseBlock.prototype.blockAfterDrop = function(id, callflow, json_source){
        var json = callflow.find_id(id, callflow.jsonData), // получаем данные блока-получателя
            condition = json_source.condition,
            module_class = json_source.module_class,
            macro_str;

        $('#node_'+json_source.id).data({condition: condition});

        if (typeof callflow[module_class].macro_name !== undefined) {
            json_source.extens[0].apps = callflow[module_class].formApps(json_source);
        }

        /*
         * После перехода на макросы все содержимое пишется в рутовый контекст
         */
        /*
        //формируем Goto
	var entry_point = "${EXTEN}";
        if ( json.module_class == 'root' ) { // для рута удаляем из всех копий
            for ( var i = 0, length = json.extens.length; i< length; i++ ){
		if ( !json_source.multiple ){
		    callflow.form_goto(json.extens[i].apps,"Goto("+json_source.context_name+","+entry_point+",1)");
		}
		else {
		    json.extens[0].apps.push({"n": "Gosub("+json_source.module_class+","+json_source.id+",1)"});
		}
            }
        }
        else {
	    // ищем обычный парент блок
	    while ( json.multiple ) {
		    json = callflow.get_parent(json.id);
	    }
	    if ( !json_source.multiple ){
		callflow.form_goto(json.extens[0].apps,"Goto("+json_source.context_name+","+entry_point+",1)");
	    }
	    else {
		json.extens[0].apps.push({"n": "Gosub("+json_source.module_class+","+json_source.id+",1)"});
	    }

	}
        */

    }


function blockRoot(){
    this.icon = 'icon-asterisk';
    this.title = 'ROOT';
    this.tooltip = 'Root';
    this.module_class = 'root';
    this.extens = [{
        key: "_XX.",
        apps: [
           {"1": "NoOp(StartCallflow)"},
           {"n": "Set(__calltype=INCOMING)"},
           {"n": "Set(__ANI=${CALLERID(num)})"},
           {"n": "Set(__FROM_DID=${EXTEN})"}
        ]
    }];

// метод вызывается при двойном клике по блоку
    this.blockAction = function(id, callflow){
        var json = callflow.find_id(id, callflow.jsonData) ;

        if ( typeof(json.extens) == 'undefined' || json.extens.length == 0 )
            json.extens = this.extens;
        
        var apps = json.extens[0].apps;

         if ( typeof(json.property) == 'undefined' || typeof(json.property) != 'object' )
            json.property = {
                custom_name: '',
                order: 0
            };

        if ( typeof(json.property.custom_name) == 'undefined' )
            json.property.custom_name = '';

        if ( typeof(json.property.pattern) == 'undefined' ){
            var pattern = '';
            for ( var i=1,length=json.extens.length; i< length; i++){
                if ( pattern != '' )
                    pattern += ",";
                pattern += json.extens[i].key
            }
            json.property.pattern = pattern;
        }
        var form = '';
        form += '<div class="form-horizontal">';
        form += ' <div class="control-group"> \
                    <label class="control-label" for="name">Name</label> \
                        <div class="controls"> \
                            <input type="text" name="name" id="name" placeholder="Name Rule" required value="'+json.name+'"> \
                        </div> \
                  </div> ';
        form += ' <div class="control-group"> \
                    <label class="control-label" for="pattern">Pattern</label> \
                        <div class="controls"> \
                            <input type="text" name="pattern" id="pattern" placeholder="Pattern" required value="'+json.property.pattern+'"> \
                        </div> \
                  </div> ';
        form += ' <div class="control-group"> \
                    <label class="control-label" for="order">Comment</label> \
                        <div class="controls"> \
                            <input type="text" name="custom_name" id="custom_name" placeholder="comment" value="'+json.property.custom_name+'"> \
                        </div> \
                  </div> ';
        form += '</div>';
        showDialog('Rule property', form, '600', 'auto', 
        //modalShow('Rule property', form, '600', 'auto', 
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
                var name_rule = $('#name').val();  
                var custom_name = $('#custom_name').val();

                json.property.custom_name = custom_name;
                
                json.property.name = name_rule;
		
		var pattern = $('#pattern').val();
                json.property.pattern = pattern;
		
		callflow.update_detail(json);
		$('#node_'+json.id).find('.details').html(custom_name + " " + pattern);
		
                var patterns = json.property.pattern.split(",");
                json.extens[0].key = patterns[0];
                // Удаляем текущие копии
                if ( json.extens.length > 1 )
                    json.extens.splice( 1, (json.extens.length-1) );
                // Делаем копии паттернов
                var apps = json.extens[0].apps.slice(0);
                if ( patterns.length > 1 ) {
                    for ( var i=1,length=patterns.length;i< length; i++){
                        json.extens.push({key:patterns[i], apps: apps});
                    }
                }
                
                $(this).dialog('close');
              }
             }
            ]);
        
    }

}

blockRoot.prototype = new baseBlock();
