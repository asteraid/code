/**
 * Набор методов для работы с классами модулей callflow
 * 
 */
var db = require('../../modules/db');

exports.get_module_class = function(req, res){
  var query = 'SELECT id, name, description, macro_name, abbr, iconCls, js_class_name, exten AS exten_name from module_class WHERE id > 1 ORDER BY name';
        
  db.query(req, query, function(error, results, fields) {
    if (!error) {
      if (results.length > 0) {
        get_structure(error, results, 0, req, function(error) {
          if (!error)
            res.json({success: true, rows: results, results: results.length});
          else
            res.json({success: false, rows: [], message: error.code});  
        });
      } else
        res.json({success: false, rows: [], message: 'Not found!'});
    } else
      res.json({success: false, rows: [], message: error.code });
  });
}

get_structure = function(error, rows, index, req, callback) {
  if (!error) {
    if (index < rows.length) {
      var query = 'SELECT id, field_name, field_type, seq, required, default_value, list_data_view, help_block FROM class_structure WHERE id_class = ? ORDER BY seq';
      db.query(req, query, [rows[index].id], function(error, results, fields) {
        if (!error)
          rows[index].structure = results;
        get_structure(error, rows, index + 1, req, callback);
      });
    } else
      callback(error);
  } else
      callback(error);
}


/**
 *  Возвращаем результат представления для полей select2
 */
exports.get_list_view = function(req, res){
  var viewName = req.param('view_name');
    
  if (viewName) {
    db.query(req, 'SELECT * FROM ??', [viewName], function(error, results, fields) {
      if (!error)
        res.json({success: true, data: results, results: results.length});
      else
        res.json({success: false, data: [], message: error.code });
    });
  } else
    res.json({success: false, data: [], message: "Name View is Empty" });
}