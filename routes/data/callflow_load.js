/**
 * Загрузка дерева callflow из таблиц
 */
var db = require('../../modules/db');

exports.get_callflow = function(req, res){
  var id = req.param('id');
  var res_tree;
  
  var query = [
    'SELECT name, metric, pattern, comment, parent_id',
    'FROM config_items ci',
    'JOIN config_relations cr',
    'ON ci.id = cr.item_id AND type = "rule" AND ci.id = cr.rule_id',
    'WHERE rule_id = ? limit 1'
  ].join(' ');
        
  db.query(req, query, [id], function(err, results, fields) {
    if (!err) {
      if (results.length > 0) {
        var name_root = results[0].name;
        var metric    = results[0].metric;
        var pattern   = results[0].pattern;
        var comment   = results[0].comment;
        var parent_id = results[0].parent_id;
        
        query = [
          'SELECT item_id, block_id, parent_id, unique_item_id, label, context_name, `condition`, custom_name, var_metric, var_name, var_val, type, commented, id_class, class_name, class_description, macro_name, class_abbr, class_icon, exten_name',
          'FROM vCallflowTreeContent',
          'WHERE callflow_id = ? ORDER BY var_metric'
        ].join(' ');
        
        db.query(req, query, [id], function (err, results, fields) {
          if (!err) {
            // формируем json дерево
            var markVarMetric = results[results.length - 1].var_metric;
            res_tree = form_tree(results, parent_id, markVarMetric);

            // Допиливаем дерево
            finished_tree(res_tree, 0, function(){
              res.json({success: true, data: res_tree[0]});
           });
          } else
            res.json({success: false, message: err.code });
        });
      } else
          res.json({success: false, message: "Not found callflow"});
    }
  });

  /**
   * Формируем дерево
   * @param {Array} data - массив дерева
   * @param {Number} parentId - id родителя
   * @param {Number} markVarMetric - граничено значение вар метрик после которого
   *                 мы не забираем содержимое, в случае с несколькими extens
   *                 чтобы не получить дублирование контекста
   */
  function form_tree(data, parentId, markVarMetric) {
    var result = [];
    var nodes = {};
    var i;
    var length;
    var extenLenth;
    var itemId;
    var row;
    var regex = /(.*?),(.*)/;
    var matched;
    var key;
    var apps_row;
    var exten_row;
    var current_apps;
    var children;
    var current_mark;

    for (i = 0, length = data.length; i < length; i++) {
      row = data[i];
      if (row.parent_id === parentId && row.var_metric <= markVarMetric) {
        itemId = row.block_id;
        if (!nodes.hasOwnProperty(itemId)) {
          nodes[itemId]                   = {};
          nodes[itemId]['id']             = itemId;
          nodes[itemId]['itemId']         = row.item_id;
          nodes[itemId]['unique_item_id'] = row.unique_item_id;
          nodes[itemId]['extens']         = [];
          nodes[itemId]['name']           = row.context_name;
          nodes[itemId]['condition']      = row.condition;
          nodes[itemId]['callflow_type']  = row.type;
          nodes[itemId]['id_class']       = row.id_class;
          nodes[itemId]['module_class']   = row.class_name;
          nodes[itemId]['title']          = row.class_abbr;
          nodes[itemId]['macro_name']     = row.macro_name;
          nodes[itemId]['exten_name']     = row.exten_name;
          nodes[itemId]['module_icon']    = row.class_icon;
          nodes[itemId]['tooltipe']       = row.class_description;
          nodes[itemId]['property']       = {
            'pattern'     : '',
            'custom_name' : row.custom_name
          };
          
          if (row.label !== '') {
            nodes[itemId]['branch'] = {label: row.label};
          }
        }
        
        if (row.var_name === 'exten') {
          // Получаем exten.key
          matched = row.var_val.match(regex);
          key = matched[1];
          if (nodes[itemId]['property'].pattern !== '') {
              nodes[itemId]['property'].pattern += ',';
          }
          nodes[itemId]['property'].pattern += key;
          
          //получаем строку apps
          matched = matched[2].match(regex);
          apps_row = {};
          apps_row[matched[1]] = matched[2];
          
          // формируем extens key
          exten_row = {"key": key, "apps": [apps_row]};

          if ( nodes[itemId]['extens'].length === 1 ) {
            current_mark = row.var_metric;
          }
          nodes[itemId]['extens'].push(exten_row);
        } else if (row.var_name === 'same') {
        
            // Получаем текущий apps - последний элемент массива
            extenLength = nodes[itemId].extens.length;
            if (extenLength > 0) {
              current_apps = nodes[itemId].extens[extenLength-1].apps;
            } else {
              current_apps = [];
              nodes[itemId].extens.push({"apps": current_apps});
            }
            matched = row.var_val.match(regex);
            if (matched) {
              apps_row = {};
              apps_row[matched[1]] = matched[2];
              current_apps.push(apps_row);
            }
        }
      }
    }

    // Преобразуем в массив
    for (itemId in nodes ) {
      if (nodes[itemId]['extens'].length === 0) {
        nodes[itemId]['extens'] = [{apps:[]}];
      }
      result.push(nodes[itemId]);
      //nodes[itemId].children = form_tree(data, +itemId, callback) ;
    }

    if (current_mark) {
      markVarMetric = current_mark;
    }

    for (i = 0, length = result.length; i < length; i++) {
      children = form_tree(data, +result[i].id, markVarMetric);
      if (children.lenght === 0) {
        result[i].leaf = true;
      } else {
        result[i].leaf = false;
        result[i].children = children;
      }
    }

    return result;
  }

  /**
   *  Допиливаем дерево
   *  Рекурсивная функция. Дополняет узлы дерева информацией по структуре полей
   *  @param {Object} tree - дерево
   *  @param {Number} index - текущий индекс
   *  @param {Function} callback
   */
  
  function finished_tree(tree, index, callback) {
    var query;
    if (index < tree.length) {

      var next_step = function() {
        if (tree[index].hasOwnProperty('leaf') && tree[index].leaf === false && tree[index].hasOwnProperty('children')) {
          finished_tree(tree[index].children, 0, function(){
              finished_tree(tree, index+1, callback);
          });
        } else {
          finished_tree(tree, index+1, callback);
        }
      }

      if (tree[index].id_class > 1) {
        // получаем структуру класса
        query = [
          'SELECT cs.id, cs.field_name, cs.field_type, seq, required, cs.default_value, cs.list_data_view, cs.help_block, ifd.value',
          'FROM class_structure cs LEFT JOIN items_field_data ifd',
          'ON cs.id = ifd.id_field AND ifd.id_item = ?',
          'WHERE cs.id_class = ?',
          'ORDER BY seq'
        ].join(' ');

        db.query(req, query, [tree[index].itemId, tree[index].id_class], function (err, results, fields) {
          if (!err) {
            tree[index].structure = results;
          } else {
            console.log("err",err);
          }
          // Получаем структуру веток
          query = [
            'SELECT name, exitcode, CONCAT("label_", ?, "_", exitcode) AS label, cls',
            'FROM class_branches WHERE id_class = ?'
          ].join(' ');

          db.query(req, query, [tree[index].unique_item_id, tree[index].id_class], function (err, results, fields) {
            if (!err) {
              tree[index].list_branches = results;

              var find_label = function(label) {
                var name = '';
                results.forEach( function(item) {
                  if (item.label === label) {
                    name = item.name;
                    return false;
                  }
                });
                
                return name;
              }
              
              // Проставляем значение метки
              if (tree[index].list_branches.length !== 0) {
                tree[index].children.forEach(function(item) {
                  if (typeof(item.branch) === 'object') {
                    item.branch.name = find_label(item.branch.label);
                    //console.log('branch',item.branch);
                  }
                });
              }
            } else {
              console.log("err",err);
            }
            
            next_step();
          });
        });
      } else
        next_step();
    } else {
        if (typeof callback === 'function') {
          callback();
        }
    }
  }
}


/**
 * Получаем структуру блока по id
 */
exports.get_callflow_structure = function(req, res) {
  var item_id         = req.param('item_id');
  var id_class        = req.param('id_class');
  var unique_item_id  = req.param('unique_item_id');
  var structure;
  var branches;

  // получаем структуру класса
  var query = [
    'SELECT cs.id, cs.field_name, cs.field_type, seq, required, cs.default_value, cs.list_data_view, cs.help_block, ifd.value',
    'FROM class_structure cs',
    'LEFT JOIN items_field_data ifd',
    'ON cs.id = ifd.id_field AND ifd.id_item = ?',
    'WHERE cs.id_class = ?',
    'ORDER BY seq'
  ].join(' ');

  db.query(req, query, [item_id, id_class], function(err, results, fields) {
    if (!err) {
      structure = results;
      // Получаем структуру веток
      query = [
        'SELECT name, exitcode, CONCAT("label_", ?, "_", exitcode) AS label, cls',
        'FROM class_branches WHERE id_class = ?'
      ].join(' ');

      db.query(req, query, [unique_item_id, id_class], function(err, results, fields) {
        if (!err)
          res.json({success: true, data: { structure: structure, branches: results}});
        else
          res.json({success: false, message: err.code});
      });
    } else
      res.json({success: false, message: err.code });
  });
}