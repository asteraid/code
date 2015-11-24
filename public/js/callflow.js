/**
 * Класс для вывода диаграммы callflow
 * # Пример структуры
 * @example
 * this.rootData = {
 *                             id: 0,
 *                             name: 'MyFlow',
 *                             title: 'ROOT',
 *                             module_icon: 'icon-asterisk',
 *                             module_class: 'root',
 *                             property: {
 *                                custom_name:  'start flow'
 *                             }
 *                      };
 *
 *   this.jsonData = [
 *       {id: '1', module_name: 'User', module_icon: 'icon-user', detail: 'user', leaf: false,
 *           children:[
 *               {id: '2', module_name: 'Ring Group', module_icon: 'icon-bell', detail: 'ring', leaf: false,
 *                   children:[
 *                        {id: '5', module_name: 'test2', module_icon: '', detail: 'test2', leaf: false,
 *                           children:[
 *                           ]}
 *                   ]},
 *               {id: '3', module_name: 'Conference', module_icon: 'icon-calendar', detail: 'conference', leaf: false,
 *                   children:[
 *                   ]},
 *               {id: '4', module_name: 'test', module_icon: '', detail: 'test', leaf: false,
 *                   children:[
 *                       {id: '6', module_name: 'test3', module_icon: '', detail: 'test3', leaf: false,
 *                           children:[
 *                               {id: '8', module_name: 'test5', module_icon: '', detail: 'test5', leaf: false,
 *                               children:[
 *                                   ]}
 *                           ]},
 *                       {id: '7', module_name: 'test4', module_icon: '', detail: 'test4', leaf: false,
 *                           children:[
 *                           ]}
 *                   ]}
 *       ]}
 *   ];
 */
function callFlowChart(){
    
    this.chartId = 'callflow';
    
    this.separator = '__';

    this.rootData = {};

    this.jsonData = [];
    
    this.maxId = 0;

    var createNode = function(id_node,title,module_icon,detail){
        var node = '<div class="node icons_black" id="node_'+id_node+'">';
            node += '  <div class="node-options">';
            
            if (title == 'Menu')
                node += '    <div id="collapse_' + id_node + '" class="collapse-node"></div>';
            
            if ( title != 'ROOT')
                node += '    <div id="delnode_'+id_node+'" class="delete"></div>';
            
            node += '      <div class="module">';
            node += '           <div class="div_icon">';
            node += '             <span class="icon-white '+module_icon+'"></span>';
            node += '             <span class="title">'+title+'</span>';
            node += '           </div>';
            node += '           <div class="details tip-left" title="'+detail.replace("<br>"," ")+'">'+detail+'</div>';
            node += '      </div>';
            node += '  </div>';
            node += '</div>';
        return node;
    }
    
    var createRootBranch = function(chart,json_data){
        var branch = createChildNode(chart, json_data);
        return branch;
    }
    
    var createChild = function(appendSel,id){
        return $('<div class="child" id="'+id+'"></div>').appendTo(appendSel);
    }
    
    var createBranch = function(appendChild){
        return $('<div class="branch"></div>').appendTo(appendChild);
    }
    
    var createChildren = function(appendBranch){
        return $('<div class="children"></div>').appendTo(appendBranch);
    }
    
    
    var self = this;
    
    var createChildNode = function(children, json_data){
        var child = createChild(children,'child_'+json_data.id);

               child.append('<div class="span_arrow small"></div>');
               // Проставляем на стрелках условие
               if ( typeof(json_data.branch) === 'object' && json_data.branch.name ){
                   // Получаем родительский элемент и класс условия
                   var parent_node_data = child.parent().parent().children('.node').data();
                   var cls = '';
                   if ($.isArray(parent_node_data.list_branches) && parent_node_data.list_branches.length > 0) {
                        $.each(parent_node_data.list_branches, function(index, item){
                            if ( item.label === json_data.branch.label ) {
                                // выставляем соостветствие бутстраповских стилей кнопки и метки
                                if (item.cls === 'danger') {
                                    cls = 'badge-important';
                                } else if (item.cls === 'primary') {
                                    cls = 'badge-info';
                                } else {
                                    cls = 'badge-' + item.cls;
                                }
                                return false;
                            }
                        });
                   }
                   class_condition = "badge " + cls;

                   child.children('.span_arrow').append('<span class="'+class_condition+'">'+json_data.branch.name+'</span>');
                   
               }
               
               child.append('<div class="clear"></div>'); 
               child.append('<div class="div_line"></div>');
               child.append('<div class="clear"></div>'); 
               
               var branch = createBranch(child);
	       
	       var detail = form_detail(json_data);
               var node = createNode(json_data.id, json_data.title, json_data.module_icon, detail);
               
               branch.append(node);

               $('#node_'+json_data.id).data(json_data);

               // dblclick on node
               if ( json_data.hasOwnProperty('module_class') ){
                   var module_class = json_data.module_class;
                   if ( self.hasOwnProperty(module_class) ){
                       if( typeof(self[module_class].blockAction) == 'function' ){
                          ( function(id){
                            $('#node_'+id).dblclick(function(){
                               self[module_class].blockAction(id, self);
                           });
                          })(json_data.id);
                       }
                   }
                   
               }
               
               $('#node_'+json_data.id).draggable({
                   containment:".callflow",
                   scroll: true,
                   revert: "invalid",
                   revertDuration: 0,
                   stack: ".node",
                   start: function () {
                            var children = $(this).next(), t, l;
                            
                            if ( children.length > 0 ){
                                t = children.offset().top - $(this).offset().top;
                                l = children.offset().left - $(this).offset().left;
                                
                                $(this).attr('t', t); 
                                $(this).attr('l', l);
                                
                            }
                            
                        },
                        
                   drag: function () {
                            var children = $(this).next(), t, l;
                            if ( children.length > 0 ){
                                t = $(this).offset().top + parseInt($(this).attr('t'));
                                l = $(this).offset().left + parseInt($(this).attr('l'));
                                children.offset({ top: t, left: l });
                            }
                        },
                        
                   stop: function(event, ui) { 
                            var children = $(this).next(), t, l;
                            if ( children.length > 0 ){
                                t = $(this).offset().top + parseFloat($(this).attr('t'));
                                l = $(this).offset().left + parseFloat($(this).attr('l'));
                                children.offset({ top: t, left: l });
                            }  
                       }

               });
               
               $('#node_'+json_data.id).droppable({
                    greedy: true,
                    accept: function(el){
                        var data = $(this).data();
                        if ( data.module_class == 'Hangup' ) {
                            return false;
                        } else if ( (!$.isArray(data.list_branches) || data.list_branches.length === 0) && $(this).parent().children(".children").children().length > 0) {
                            return false;
                        } else if ($.isArray(data.list_branches) && data.list_branches.length > 0 && $(this).parent().children(".children").children().length >= data.list_branches.length) {
                            return false;
                        } else {
                            return el.hasClass("node") || el.hasClass("item") ;
                        }
                    },
                    activeClass: "ui-state-active",
                    hoverClass: "ui-state-hover",
                    drop: function(event, ui){
                        var draggable = $(ui.draggable[0]).clone(true),
                            target = $(this),
                            target_data = target.data(),
                            draggable_data = draggable.data('module_data'),
                            module_class = '';

                        //$(this).addClass("ui-state-highlight")
                        // Определяем класс блока на который бросаем
                        if ( target_data.hasOwnProperty('module_class') ) {
                               var module_class = target_data.module_class;
                            }
			
			var go_drop = function(){
			    // вызываем метод блока before drop
			    if ( module_class != '' && self.hasOwnProperty(module_class) && typeof(self[module_class].blockBeforeDrop) == 'function' ){
				self[module_class].blockBeforeDrop(self, target, draggable, drop_block );
			    } else {
				drop_block(target, draggable,'');
                            }
			}

			if ( draggable_data.id_class ){
			    $.getJSON('/data/items/list?type=callflow&id_class='+draggable_data.id_class, function(data){
				 var list_item = [{id: 0, text: '(Новый)'}];
				 for ( var i = 0,length = data.rows.length; i < length; i++ ){
				     //list_item.push( {id: data.rows[i].id, text: data.rows[i].name + ' #' + data.rows[i].id} );
                                     data.rows[i].text = data.rows[i].name + ' #' + data.rows[i].id;
                                     list_item.push(data.rows[i]);
				 }
				 if ( list_item.length > 0){
				    var form = '<form id="items_form">';
				    form += '<div class="form-horizontal">';
				    form += ' <div class="control-group"> \
						<label class="control-label" for="item">Item</label> \
						    <div class="controls"> \
							<input type="text" name="item" id="item" placeholder="Please enter callflow item&#8230;"> \
						    </div> \
					      </div> ';
				    form += '</div></form>';	
            var btns = [
              {
                text: 'Cancel',
                class: "btn",
                click: function(e){
                  //$(this).dialog('close');
                  $(this).dialog('destroy');
                }
              },
              {
                text: 'Select',
                class: "btn btn-primary",
                click: function(e){
                  if ( $('#items_form').valid() ) {    
                    var item_id = $('#item').val(),
                    data = $.extend({},$('#item').select2('data'));
                    data.itemId = item_id;
                    data.extens = [{apps:[]}];

                    var get_structure = function() {
                    // Получаем item
                      $.getJSON('/data/callflow_load/get_callflow_structure',
                        {
                            item_id: draggable_data.itemId,
                            id_class: draggable_data.id_class,
                            unique_item_id: draggable_data.unique_item_id
                         },
                        function(result){
                               if (result.success) {
                                   draggable_data.structure = result.data.structure;
                                   draggable_data.list_branches = result.data.branches;
                                   go_drop();
                               }
                               else {
                                   alert('Ошибка получения контекста',result.message);
                               }
                               $('body').unmask();
                          }
                      );
                    }

                    if ( item_id > 0 ){
                      $.extend(draggable_data,data);
                      // получаем ид блока
                      $.ajax({
                        type: 'POST',
                        dataType: 'json',
                        url: '/data/callflow_save/insert_config_relation',
                        data: {
                              item_id: item_id,
                              rule_id: self.callflowId,
                              parent_id: target_data.id
                        },
                        success: function(res){
                           draggable_data.id = res.id;
                           draggable_data.unique_item_id = res.id;
                           get_structure();
                        },
                        error: function(jqXHR, textStatus, errorThrown) {
                          alert(textStatus);
                        }
                      });
                    } else {
                      // если новый блок - создаем item
                      $.ajax({
                        type: 'POST',
                        dataType: 'json',
                        url: '/data/callflow_save/insert_callflow',
                        data: {
                              data: draggable_data,
                              rule_id: self.callflowId,
                              parent_id: target_data.id
                        },
                        success: function(res){
                          draggable_data.itemId = res.item_id;
                          draggable_data.id = res.id;
                          draggable_data.unique_item_id = res.id;
                          get_structure();
                        },
                        error: function(jqXHR, textStatus, errorThrown){
                            alert(textStatus);
                        }
                      });

                    }
                    //$(this).dialog('close');
                    $(this).dialog('destroy');
					      }
					  }
					 }
					];

          modal({
            title: 'Select callflow item',
            body: form,
            width: 600,
            height: 180,
            buttons: btns,
            beforeOpen: function(){
              $("#item").select2({multiple: false, data: list_item, width: "300"});
              $("#item").select2("val",0);
            }
          });
				 }
				 else {
				    go_drop();
				 }
			     });
			}
			else {
			    go_drop();
			}

                      }
               });
               // collapse node
               $('#collapse_' + json_data.id).on('click', function() {
                if ($(this).hasClass('close')) {
                    $(this).closest('.branch').find('> .children').show();
                    $(this).removeClass('close');
                } else {
                    $(this).closest('.branch').find('> .children').hide();
                    $(this).addClass('close');
                }
               });
               // delete node
               $('#delnode_'+json_data.id).click(function(){
                   var node = $(this).parent().parent();
                   var node_data = node.data();
                   modalShow('Removing the unit',
                       'Are you sure you want to delete module <b>'+node_data.name+'</b> with all children?',
                       function(){
                        var id = node_data.id;
                        // определяем верхний блок
                        var parent_node_data = $('#child_'+id).parent().parent().children('.node').data();
                        // вызываем метод удаления родительского блока
                         if ( parent_node_data.module_class != '' ) {
                               if ( self.hasOwnProperty(parent_node_data.module_class) ){
                                   if( typeof(self[parent_node_data.module_class].blockAfterChildDel) == 'function' ){
                                         self[parent_node_data.module_class].blockAfterChildDel(parent_node_data.id, self, node_data );
                                   }
                               }
                           }
                           
                         // вызываем метод блока
                        // вызываем метод блока before delete
                        if ( module_class != '' && self.hasOwnProperty(module_class) && typeof(self[module_class].blockBeforeDelete) == 'function' ){
                            self[module_class].blockBeforeDelete(id,node_data);
                        }
                        
                        self.del_id(id, self.jsonData);
                        $('#child_'+id).remove();
                        
                   });
               });
               
               return branch;
    }
    
    /** метод обработки дропа
     * @param {Object} branch - описание ветки
     * @param {String} branch.label - метка
     * @param {String} branch.name - имя метки
     */
    var drop_block = function(target, draggable, branch){         
        var target_id = target.attr("id").split('_')[1];
        
        // drop
        if ( draggable.hasClass('node') ){
            var source_id = draggable.attr("id").split('_')[1];

            var json_source = self.find_id(source_id, self.jsonData) ;
            if (typeof(branch) === 'object') {
                json_source.branch = branch;
            }
            self.del_id(source_id, self.jsonData) ;
            var json_target = self.find_id(target_id, self.jsonData) ;
            json_target.leaf = false;
            if ( !json_target.hasOwnProperty('children') )
                json_target.children = [];
            json_target.children.push(json_source);

            $('#'+self.chartId).empty();
            self.formFlow();
        }
        else { // если натягиваем новый блок
            // получить branch node
            var branch_node = target.parent();
          // Узнать есть ли children
            var children = branch_node.children('.children');
            if ( children.length == 0 ){
            // Если нет - создать children у branch
                var children = createChildren(branch_node);
            }

            var json_source = jQuery.extend(true, {}, draggable.data('module_data'));
            json_source.leaf = true;
            //json_source.entry_point = entry_point;
            if (typeof(branch) === 'object') {
                json_source.branch = branch;
            }

                createChildNode(children, json_source);

                // формируем новый json

                var json_target = self.find_id(target_id, self.jsonData) ;
                json_target.leaf = false;
                if ( !json_target.hasOwnProperty('children') )
                    json_target.children = [];
                json_target.children.push(json_source);
        }

        // вызываем метод после дроп
        if ( target.data().hasOwnProperty('module_class') ) {
           var module_class = target.data().module_class;
        }
        if ( module_class != '' ) {
               if ( self.hasOwnProperty(module_class) ){
                   if( typeof(self[module_class].blockAfterDrop) == 'function' ){
                         self[module_class].blockAfterDrop(target.attr("id").split('_')[1], self, json_source );
                   }
               }
           }

        // вызываем метод после дропа источника
        if ( json_source.hasOwnProperty('module_class') ) {
           var module_class_source = json_source.module_class;
        }
        if ( module_class_source != '' ) {
               if ( self.hasOwnProperty(module_class_source) ){
                   if( typeof(self[module_class_source].blockAfterDropSource) === 'function' ){
                         self[module_class_source].blockAfterDropSource( self, json_source );
                   }
               }
           }

    }
    
    var form_detail = function(json_data){
	var detail = json_data.name,
            apps;
        if (json_data.extens) {
            apps = json_data.extens[0].apps;
        }
        // TODO: переделать из конфига
	switch ( json_data.module_class ){
	    case 'root':
		detail = (json_data.property.custom_name ? json_data.property.custom_name : json_data.name) + ' ' + json_data.property.pattern;
		return detail;
		break;
	    case 'TP':
		if ( detail != '')
			detail += "<br>";
		if ( self.get_param(apps,'PREFADD') != "" ){
		    detail += '++'+self.get_param(apps,'PREFADD');
		}
		if ( self.get_param(apps,'PREFREMOVE') != "" ){
		    detail += '--'+self.get_param(apps,'PREFREMOVE');
		}
		break;
	    case 'Callout':
		var server = self.get_param(apps,'ServerName');
		var trunk = self.get_param(apps,'TRUNK');
		if ( detail != '')
			detail += "<br>";
		if ( server != "" && server != 'ALL'){
		    detail += server+'/';
		}
		if ( trunk != "" ){
		    detail += trunk;
		}
		break;
	    case 'RingGroup':
		// получаем данные по ринггруппе
		// Синхронно
		$.ajax({
		      url: '/data/ringgroup/get_ringgroup',
		      dataType: 'json',
		      async: false,
		      data: {
		      context_name: json_data.name
		     },
		      success: function(res){
		      if ( detail != '')
			detail += "<br>";
		     detail += res.extension.join();
		     }
		    });

		break;
	    case 'Hangup':
		detail = 'Hangup';
		break;
	}
	return detail;
    }
    
    this.update_detail = function(json){
	var details = $('#node_'+json.id).find('.details');
	var detail_content = form_detail(json);
	details.html(detail_content);
	// ставим tooltip
	details.attr( "title", detail_content.replace("<br>"," ") );
    }
    
    this.formTree = function(branch, json){
        if ( typeof(json) != 'undefined' && json.length > 0){
            var children = createChildren(branch);
            for ( var i = 0; i < json.length; i++ ){
             if ( i in json ){
                 var branch = createChildNode(children, json[i]);
               if ( !json[i].leaf ){
                   this.formTree(branch, json[i].children);
               }
             }
           }
       }
    }
    
    // Загружаем схему с файла
    this.getJsonTree = function(id){
        self.callflowId = id;
        $('body').mask(opts);
        $.getJSON('/data/callflow_load/get_callflow',
          {id: id},
          function(result){
                 if ( result.success) {
                     self.jsonData = result.data;
                     self.formFlow();
                     
                     //for all collapse blocks
                     $('.collapse-node').trigger('click');
                 }
                 else {
                     alert('Ошибка чтения дерева',result.message);
                 }
                 $('body').unmask();
            }
        );
    }
    
    this.formFlow = function(){
       
       // берем первый элемент - он должен быть классом рут
       if ( this.jsonData.module_class == 'root' ) {
       // Формируем ссылку на рута
       this.rootData = {
           id: this.jsonData.id,
           name: this.jsonData.name,
           title: this.jsonData.title,
           module_icon: this.jsonData.module_icon,
           module_class: this.jsonData.module_class,
           property: this.jsonData.property,
	   extens: this.jsonData.extens
       }
       var branch = createRootBranch( $('#'+this.chartId), this.rootData );
       this.formTree(branch, this.jsonData.children);
       }
       else {
           alert('Первый элемент должен быть root!');
       }
    }
    
    // поиск объекта в дереве по ид
    this.find_id = function(id, json){
        var find = undefined;
        if ( json instanceof Array ){ // если не корень
            if ( json.length > 0){
                for (var i = 0; i < json.length; i++){
                  if ( i in json ){
                    if ( json[i].id == id )
                        find = json[i];
                    else  if ( !json[i].leaf ){
                          find = this.find_id(id, json[i].children);
                        }
                    if ( typeof(find) == 'object' )
                       break; 
                  }
                }
            }
        }
        else {
            if ( json.id == id )
                        find = json;
                    else  if ( !json.leaf ){
                          find = this.find_id(id, json.children);
                        }
        }
            
        return find;
    }

    // удаление объекта из дерева по id
    this.del_id = function(id, json){
        var find = false;
        if ( json instanceof Array ){ // если не корень
            if ( json.length > 0){
                for (var i = 0; i < json.length; i++){
                  if ( i in json ){
                    if ( json[i].id == id ){
                        delete json[i];
                        find = true;
                    }
                    else  if ( !json[i].leaf ){
                          find = this.del_id(id, json[i].children);
                        }
                    if ( find )
                       break; 
                  }
                }
            }
        }
        else {
            if ( json.id == id ){
                        // delete json[i]; // удалять рут нельзя
                        find = false;
                    }
                    else  if ( !json.leaf ){
                          find = this.del_id(id, json.children);
                        }
        }
            
        return find;
    }
    
    // удаляем gosub из контекста, удяются так же все записи ниже
    this.drop_gosub = function(apps, context_val){
	var flag_delete = false;
        for ( var i = 0; i< apps.length; i++ ){
            if ( i in apps ){
               for (var key in apps[i]) {
                                if (apps[i].hasOwnProperty(key)){
                                  if ( apps[i][key] == context_val || flag_delete ){
                                      apps.splice(i,1);
                                      i--;
				      if ( !flag_delete ){ // выставляем флаг удаления остальных записей
					  flag_delete = true; 
				      }
                                  }
                                }
                          }
            }
        }
    }

    // get param value species Set(__calltype=INCOMING)
    // default_value - значение по умолчанию
    this.get_param = function(apps,param_name,default_value){
        if ( typeof(default_value) == 'undefined' ){
            var default_value = "";
        }
        var value = null;
        var regexp = new RegExp("^Set\\(__"+param_name+"=(.*)\\)$","i");
        var find = false;
        var match;
         for ( var i = 0,length = apps.length; i < length; i++ ){
            if ( i in apps ){
               for (var key in apps[i]) {
                                if ( apps[i].hasOwnProperty(key) && ( match=regexp.exec( apps[i][key] ) ) ){
                                   find = true; 
                                   value = match[1];
                                }
                          }
            }
            if ( find )
                break;
        }
        if ( value == null )
            value = default_value;
        return value;
    };
    
    // формируем строку вида Set(__calltype=INCOMING)
    var form_set_string = function(param_name,param_val){
        return "Set(__"+param_name+"="+param_val+")";
    };
    
    // set/update param species Set(__calltype=INCOMING)
    this.set_param = function(apps, param_name, param_val){
        var find = false;
        var regexp = new RegExp("^Set\\(__"+param_name+"=(.*)\\)$","i");
        var ind = find_key_pattern(apps,regexp);
        if ( ind != -1 ){
            for (var key in apps[ind]) {
                                if ( apps[ind].hasOwnProperty(key) && regexp.test( apps[ind][key] ) ){
                                    apps[ind][key] = form_set_string(param_name,param_val);
                                }
                          }
        }
        else {
            // Если параметра не существует вставляем его перед sub-out-call или перед гоуто в конце
             var regexp = new RegExp("^Gosub\\(sub-out-call,\\${EXTEN},1\\)$|^GoTo\\(.*\\)$|^Queue\\(.*\\)$|^Gosub\\(.*\\)$","i");
             ind = find_key_pattern(apps,regexp);
             if ( ind == -1 ){
                 apps.push({"n": form_set_string(param_name,param_val)});
             }
             else {
                 apps.splice(ind,0,{"n": form_set_string(param_name,param_val)});
             }
        }
            
    }
    
    // Формируем дополнительный контекст транка
    this.formExtraContextTrunk = function(json,uniqueid,trunkType,trunkText){
        json.extra_contexts = [];
	var pattern = this.rootData.property.pattern;
	if ( pattern.substring(0,1) == "_" )
	{
	    pattern = pattern.substring(1);
	}
        var key = "_"+uniqueid+"^"+pattern;
	new_context = [{"key":key,
	"apps":[
		{"1":"Dial("+trunkType+"/"+trunkText+"/${CUT(EXTEN,^,2)})"}
		]
	    }];
	json.extra_contexts.push({"name": "outcall",
				  "extens": new_context
	});

    }
    
    // Поиск в apps значения соответствующего шаблону
    var find_key_pattern = function(apps,regexp){
        var ind = -1;
        for ( var i = 0,length = apps.length; i < length; i++ ){
            if ( i in apps ){
               for (var key in apps[i]) {
                                if ( apps[i].hasOwnProperty(key) && regexp.test( apps[i][key] ) ){
                                   ind = i;
                                }
                          }
            }
            if ( ind != -1 )
                break;
        }
        return ind;
    }
    
    // получить парент нод
    this.get_parent = function(id){
	return find_parent_node(id, this.jsonData);
    }
    
    var find_parent_node = function(id,json){
	    if ( json.hasOwnProperty('children') ) {
		for (var i = 0,length = json.children.length; i < length; i++ ){
		    if ( i in json.children ){
			if ( json.children[i].id == id ){
			    return json;
			}
			else {
			    var parent_node = find_parent_node(id,json.children[i]);
			    if ( parent_node !== null ){
				return parent_node;
			    }
			}
		    }
		}
	    }

	    return null;
    
    }
}

/*
 *  Модальная форма 
 */
function modalShow(title, body, callback, beforeopen ){
    $('#myModal form .modal-header h3').text(title);
    $('#myModal form .modal-body').html(body);
    $('input[type=checkbox],input[type=radio],input[type=file]').uniform();
    $('select').select2();
    $('#myModal form').off('submit');
    if ( typeof(callback) == 'function' ){
            $('#myModal form').on('submit', function(e){
                callback();
                $('#myModal').modal('hide')
                // отменим стандартный сабмит формы
                return false;
            });
    }
    else // отменяем стандартный субмит
         $('#myModal form').on('submit', function(e){
                $('#myModal').modal('hide')
                // отменим стандартный сабмит формы
                return false;
            });
        
    if ( typeof(beforeopen) == 'function' )
        beforeopen();
    
    $('#myModal').modal('show');
}

/*
 *  Диалоговое окно
 */
/*function dialogShow(title,body,width,height){
    if ( typeof(height) == 'undefined' )
        var height = 'auto';
    
    $('#modal-dialog').html(body);
    $('#modal-dialog').dialog({
        title: title,
        modal: true,
        width: width,
        height: height,
        buttons: []
    });
}*/

// выводим объект, используется в функции printJSON
function printObject(json,offset){
    var string = '';
    var begin_str = true;
                        string += '{ ';
                   for (var key in json) {
                        if (json.hasOwnProperty(key)) {
                            if ( !begin_str )
                                string += ', ';
                            else {
                                begin_str = false;
                            }

                            if ( typeof(json[key]) !== 'object' )
                                string += '"'+key+'": "'+json[key]+'"';
                            else if ( json[key] !== null && json[key].hasOwnProperty('length') ) { // если массив
                                offset += '&nbsp;&nbsp';
                                string += '"'+key+'":[<br> '+printJSON(json[key],offset)+'<br>'+offset+']';
                            }
                            else { // если объект
                                string += '"'+key+'": '+printJSON(json[key],offset);
                            }
                        }
                    }
                    string += ' }<br>';
   return string;
}

function printJSON(json,offset){
    if ( typeof(offset) == 'undefined')
        var offset = '';

    var string = '';
    
    if ( json !== null && json.hasOwnProperty('length') ){ // если массив
        if ( json.length > 0){
                for ( var i = 0; i < json.length; i++ ){
                 if ( i in json ){
                        string += offset;
                        string += printObject(json[i],offset);
                 }
               }
        }
    }
    else { // если объект
        string += printObject(json,offset);
    }
    
    return string;
}


// выводим объект, используется в функции printJSON
function printObjectConfig(json){
    var string = '',
        apps,
        i,j,key,
        length,
        begin_ext;

    // контекст выводим только рутовый
    if (json.module_class === 'root') {
        string += '['+json.name+']<br>';
    }
    /*
    if ( json.multiple ) {
	string += '['+json.module_class+']<br>';
    }
    else {
	string += '['+json.context_name+']<br>';
    }
    */
    // выводим аппс
    // В зависимости от наличия свойства key
    for (j in json.extens) { 
        if ( json.hasOwnProperty('extens') && json.extens[j].hasOwnProperty('key') && json.extens[j].hasOwnProperty('apps') ) {
            string += 'exten => '+json.extens[j].key+',';
            apps = json.extens[j].apps;
            begin_ext = true;
            for (i = 0, length = apps.length; i < length; i++) {
               if ( i in apps ){
                    for (key in apps[i]) {
                        if (apps[i].hasOwnProperty(key)) {
                            if ( !begin_ext )
                                string += '&nbsp&nbsp'+'same => ';
                            else 
                                begin_ext = false;

                            string += key+','+apps[i][key]+'<br>';
                        }
                    }
               } 
            }
            if ( json.hasOwnProperty('children') && json.children.length > 0 ){
                string += printConfig(json.children);
            }
        } else if (json.hasOwnProperty('extens') && json.extens[j].hasOwnProperty('apps')) {
            apps = json.extens[j].apps;
            for (i = 0, length = apps.length; i < length; i++){
               if (i in apps){
                    for (key in apps[i]) {
                        if (apps[i].hasOwnProperty(key)) {
                            string += '&nbsp&nbsp'+'same => ' + key+','+apps[i][key]+'<br>';
                        }
                    }
               }
            }
            if ( json.hasOwnProperty('children') && json.children.length > 0 ){
                string += printConfig(json.children);
            }
        }
    }

//    if ( json.hasOwnProperty('extra_contexts') && json.extra_contexts.length > 0 ){
//        string += printConfig(json.extra_contexts);
//    }
    
        
   return string;
}

function printConfig(json){
    var string = '';
    if ( json.hasOwnProperty('length') ){ // если массив
        if ( json.length > 0){
                for ( var i = 0; i < json.length; i++ ){
                 if ( i in json ){
                        string += printObjectConfig(json[i]);
                 }
               }
        }
    }
    else { // если объект
        string += printObjectConfig(json);
    }
    
    return string;
}

// преобразование extens в текс для редактора
function extensToConfig(json){
    var string = '';
    if ( json.hasOwnProperty('length') ){ // если массив
        if ( json.length > 0){
                for ( var i = 0; i < json.length; i++ ){
                 if ( i in json ){
                   if ( json[i].hasOwnProperty('key') && json[i].hasOwnProperty('apps') ) {
                        string += 'exten => '+json[i].key+',';
                        var apps = json[i].apps;
                        var begin_ext = true;
                        for ( var j = 0; j < apps.length; j++ ){
                           if ( j in apps ){
                                for (var key in apps[j]) {
                                    if (apps[j].hasOwnProperty(key)) {
                                        if ( !begin_ext )
                                            string += '  same => ';
                                        else 
                                            begin_ext = false;

                                        string += key+','+apps[j][key]+'\n';
                                    }
                                }
                           } 
                        }
                    } else if (json[i].hasOwnProperty('apps')) {
                        var apps = json[i].apps;
                        $.each(apps,function(index, item){
                            for (var key in item) {
                                    if (item.hasOwnProperty(key)) {
                                        string += '  same => ' + key + ',' + item[key] + '\n';
                                    }
                             }
                        });
                    }
                 }
               }
        }
    }

    return string;
}

function configToExtens(config){
    var extens = [],
        keys = {},
        arr_conf = config.split('\n'),
        regexp = new RegExp(),
        regexp = new RegExp(" *(.+?) *=> *(.+) *"),
        regexp_apps = new RegExp(" *(.+?),(.+)"),
        apps = [];
    
    if ( arr_conf.length > 0){
                for ( var i = 0, length = arr_conf.length; i < length; i++ ){
                    var match = arr_conf[i].match(regexp);
                    if ( match != null){
                        if ( match[1] == 'exten' ){
                            if ( !$.isEmptyObject(keys) ){
                                extens.push(keys);
                            }
                            var match_key = match[2].match(regexp_apps);
                            if ( match_key != null ){
                                var key = match_key[1];
                                var apps = [];
                                var match_apps = match_key[2].match(regexp_apps);
                                if ( match_apps != null ){
                                    var apps_obj = {};
                                    apps_obj[ match_apps[1] ] = match_apps[2];
                                    apps.push(apps_obj);
                                }
                                keys = { key: key, apps: apps };
                            }
                            else {
                                alert('Error custom config!');
                                break;
                            }
                        }
                        else if ( match[1] == 'same' ){
                            var match_apps = match[2].match(regexp_apps);
                                if ( match_apps != null ){
                                    var apps_obj = {};
                                    apps_obj[ match_apps[1] ] = match_apps[2];
                                    apps.push(apps_obj);
                                }
                        }
                    }
                }
                if ( !$.isEmptyObject(keys) ){
                                extens.push(keys);
                } else {
                    extens.push({apps: apps});
                }
    }
    return extens;
}


// Создание callflow
/*function create_callflow(root_extens){
    var form = '';
        form += ' <div class="control-group"> \
                    <label class="control-label" for="callflow_name">Name callflow:</label> \
                        <div class="controls"> \
                            <input type="text" name="callflow_name" id="callflow_name" placeholder="Name callflow" required value="New callflow"> \
                        </div> \
                  </div> ';
       
        
        modalShow('New Callflow',form, function(){
            var name = $('#callflow_name').val();
            $.post("/data/callflows/new_callflow",
                {
                    name: name,
                    data: JSON.stringify(root_extens)
                },
                function(data){
                    if ( data.success ){
                        alert('Callflow success create');
                        window.location = "/callflows?itemId="+data.id+"&itemName="+name;
                    }
                    else
                        alert(data.message);
                }
            );
        });
}*/

