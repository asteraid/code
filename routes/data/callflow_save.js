/**
 * Сохраняем callflow
 */
 
var db = require('../../modules/db');

exports.save = function(req, res) {
  var callflow_id = req.param('id');
  var data        = JSON.parse(req.param('data'));
  var level_num   = 0;
  var category_name;

  // Удаляем записи из `config`,`items_field_data`, `config_relations`
  var query = [
    'CALL delete_callflow_tree(?, @result)',
    'SELECT @result'
  ].join(';');
  
  db.query(req, query, callflow_id, function (err, results, fields) {
    if (!err) {                
      insert_go(data, 0, 0, function(err) {
        if (!err)
          res.json({success: true, message: "Callflow success save!"});
        else
          res.json({success: false, message: err.code});
      });
    } else
        res.json({success: false, message: err.code });
  });

  /**
   *  Рекурсия по дереву - сохранение колфлоу
   * @param {Object} children - текущий узел дерева
   * @param {number} ind - текущий индекс
   * @param {number} parent_id - id родительского itema
   * @param {function} callback - функция, выполняемая по окончанию обработки
   */
  function insert_go(children, ind, parent_id, callback) {
    var obj;
    var item_id;
    var module_class;
    var id_class;
    var custom_name   = '';
    var context_name  = ''; //название блока
    var pattern       = '';
    var condition     = '';
    var unique_item_id;
    var label         = '';
    var callflow_type = "callflow";

    if (ind < children.length) {
      obj = children[ind];

      if (obj) {
        item_id       = obj.itemId;
        module_class  = obj.module_class;
        
        if (obj.hasOwnProperty('id_class')) {
          id_class = obj.id_class;
        }

        condition       = obj["condition"];
        context_name    = obj["name"];
        unique_item_id  = obj.unique_item_id;

        if (module_class === 'root') {
          /* если рут определяем глобальный контекст */
          //category_name = obj.property.name_rule;
          category_name = obj.name;
          
          /* комментарии рутового блока */
          if (typeof(obj.property) != 'undefined' && typeof(obj.property.custom_name) != 'undefined') {
            custom_name = obj.property.custom_name;
          }

          if (typeof(obj.property) != 'undefined' && typeof(obj.property.pattern) != 'undefined') {
            pattern = obj.property.pattern;
          }
          // обновляем данные по руту
          db.query(req, 'CALL update_rule_item(?, ?, ?, ?, @result)', [callflow_id, category_name, pattern, custom_name], function (err, results, fields) {
            if (!err)
              next_step(0);
            else
              console.log(err);
          });
        } else {
            if (typeof(obj.branch) === 'object') {
              label = obj.branch.label;
            }

            // Проверем наличие ид объекта в конфиге

            var query = db.query(req, 'SELECT count(*) AS cnt FROM config_relations WHERE id = ?', obj.id, function(err, results, fields) {
              if (!err) {
                if (results[0]['cnt'] === 0) { // если элемента нет - добавляем
                  // формируем ветку дерева, конфиг, получаем ид элемента дерева
                  db.query(req, 'CALL insert_callflow_tree(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @result, @element_id); SELECT @result, @element_id;', [item_id, callflow_type, callflow_id, context_name, parent_id, '', condition, custom_name, id_class, unique_item_id, label], function (err, results, fields) {
                    if (!err) {

                      var result = results[1][0]['@result'];
                      var i;
                      var length;
                      var query;

                      obj.id = results[1][0]['@element_id']; // присваиваем ид элемента
                      
                      // сохраняем значения полей
                      if (id_class && obj.hasOwnProperty('structure')) {
                        for (i = 0, length = obj.structure.length; i < length; i++) {
                          query = [
                            'INSERT INTO items_field_data (id_item, id_field, value)',
                            'VALUES (?, ?, ?)',
                            'ON DUPLICATE KEY UPDATE value = ?'
                          ].join(' ');
                          
                          db.query(req, query, [item_id, obj.structure[i].id, obj.structure[i].value, obj.structure[i].value], function(err, results, fields) {
                            // TODO добавить исключение при ошибке
                          });
                        }
                      }
                      
                      //сохраняем контексты
                      next_step(0);
                    } else {
                      // TODO добавить исключение при ошибке
                      console.log('insert_callflow_tree error',err);
                    }
                  });
                } else
                    next_step(0);
              } else {
                // TODO добавить исключение при ошибке
                console.log('insert_callflow_tree error',err);
              }
            });
        }

        /**
         * Проходим по extens рекурсивно
         */
        var next_step = function(ind_ext) {
          if (ind_ext < obj.extens.length) {
            process_apps(obj.extens[ind_ext], 0, obj.itemId, obj.id, category_name, function() {
              ind++;
              if (obj.hasOwnProperty('leaf') && obj.leaf === false && obj.hasOwnProperty('children')) {
                level_num++;
                
                insert_go(obj.children, 0, obj.id, function() {
                  level_num--;
                  insert_go(children, ind, parent_id, function() {
                    next_step(ind_ext + 1);
                  });
                });
              } else {
                  insert_go(children, ind, parent_id, function(){
                    next_step(ind_ext+1);
                  });
              }
            });
          } else
            callback();
                        
        };

      } else
        insert_go(children, ind + 1 , parent_id, callback);

    } else if (typeof callback === 'function')
        callback();
  }

  /**
   * Рекурсия по массиву apps
   */
  function process_apps(exten, index, itemId, element_id, category_name, callback) {
    if (index < exten["apps"].length){
      var current_app   = exten["apps"][index];
      var current_value = '';                    

      for (var key in current_app) {
        if (current_app.hasOwnProperty(key))
          current_value = key+','+current_app[key];
      }

      var var_name;
      var var_val;

      if (index === 0 && exten.hasOwnProperty('key')) {
        var_name  = "exten";
        var_val   = exten["key"] + "," + current_value;
      } else {
        var_name  = "same";
        var_val   = current_value;
      }

      var params = ['extensions.conf', category_name, itemId, element_id, var_name, var_val, 0, 0, 'ALL'];
      var query = db.query(req, 'CALL insert_config_metric( ?, ?, ?, ?, ?, ?, ?, ?, ?, @res); SELECT @result;', params, function(err, results, fields) {
        if (!err) {
          var result = results[1][0]['@result'];
          process_apps(exten, index + 1, itemId, element_id, category_name, callback);
        } else {
          console.log(err);
        }

      });
    } else {
      if (typeof callback === 'function' ){
        callback();
      }
    }
  }
}

// Добавляем новый item callflow и получаем его id
exports.insert_callflow = function(req, res) {
  var data      = req.param('data');
  var name      = data.name;
	var id_class  = data.id_class;
  var rule_id   = req.param('rule_id');
  var parent_id = req.param('parent_id');

  // добавляем новую callflow
  var query = 'CALL insert_callflow("callflow", ?, ?, ?, ?, @result, @insert_id, @element_id); SELECT @result, @insert_id, @element_id;';
  db.query(req, query, [name, id_class, rule_id, parent_id], function (err, results, fields) {
    if (!err) {
      var result = results[1][0]['@result'];
      if (result) {
        var itemId      = results[1][0]['@insert_id'];
        var element_id  = results[1][0]['@element_id'];
        
        res.json({success: true, item_id: itemId, id: element_id, message: "Callflow item success create!" });
			} else
        res.json({success: false, message: "Unknown Error"});
    } else
      res.json({success: false, message: err.code});
  });
}

/**
 * Добавялем запись о блоке в config_relation
 * Получаем unique_item_id
 */
exports.insert_config_relation = function(req, res){
  var rule_id   = req.param('rule_id');
  var parent_id = req.param('parent_id');
  var item_id   = req.param('item_id');

  // добавляем новую callflow
  var query = "CALL insert_config_relation( ?, ?, ?, @result, @element_id); SELECT @result, @element_id;";
  db.query(req, query, [item_id, rule_id, parent_id], function(err, results, fields) {
    if (!err) {
      var result = results[1][0]['@result'];
      if (result) {
        var element_id = results[1][0]['@element_id'];
        res.json({success: true, id: element_id, message: "Callflow relation success create!"});
      } else
        res.json({success: false, message: "Error insert config_relation"});  
    } else
      res.json({success: false, message: err.code});
  });
}

exports.upload_file = function(req, res) {
  var fs          = require('fs');
  var file        = req.files && req.files.file ? req.files.file : undefined;
  var name        = req.param('file_name') || '';
  var description = req.param('file_description') || '';
  var path        = config.soundDir + '/';
  var ext         = '.wav';

  if (file && file.name != '') {

    if (name == '')
      name = file.name.split('.').slice(0, -1).join('.');
      
    if (fs.existsSync(path + name + ext))
      name += (new Date).getTime();
      
    if (description == '')
      description = name;
  
    if (file.mime == 'audio/wav') {
      fs.readFile(file.path, function(err, data) {
      
        if (!err) {
          fs.writeFile(path + name + ext, data, function(err) {
            if (!err) {              
              var query = [
                'INSERT INTO `config_items`',
                '(`type`, `name`, `comment`)',
                'VALUES',
                '(', ['"sound",', '"', name, '",', '"', description, '"'].join(''), ')'
              ].join(' ');
              
              db.query(req, query, function(err) {
                if (!err)
                  res.json({success: true});
                else
                  res.json({success: false, message: err.code});
              });
            } else res.json({success: false, message: "Write file error"});
            
          });
        } else res.json({success: false, message: "Error read file"});
      });
    } else res.json({success: false, message: "Wrong file type " + file.mime});
  } else res.json({success: false, message: "File not exists"});
}

exports.delete_file = function(req, res) {
  res.json({success: true});
}