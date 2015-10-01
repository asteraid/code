var db = require('../../modules/db');

exports.list = function(req, res) {
  var type = req.param('type');
  var id = req.param('id');
  var custom_type = req.param('custom_type') || '';
  var id_class = req.param('id_class');
			
  if (id == undefined) {
    if (custom_type != '')
      custom_type = " AND custom_type = '" + custom_type + "'";
                    
    if (type == 'context')
      var query = "SELECT DISTINCT `id`, `type`, `name`, `metric`, `pattern`, `comment`, `readonly`, `visible` FROM vItems WHERE `type` = '" + type + "' AND `visible` = 1";
    else {
      if (type == 'callflow')
        var query = "SELECT DISTINCT `id`, `type`, `name`, `metric`, `pattern`, `comment`, `custom_type`, if(`commented` = 0, 'No', 'Yes') `commented` FROM vItems WHERE `id_class` = " + id_class + " AND `type` = '" + type + "' " + custom_type;
      else
        var query = "SELECT DISTINCT `id`, `type`, `name`, `metric`, `pattern`, `comment`, `custom_type`, if(`commented` = 0, 'No', 'Yes') `commented` FROM vItems WHERE `type` = '" + type + "' " + custom_type;
    }
  } else
    var query = "SELECT DISTINCT * FROM vItems WHERE parent_id = " + id + " AND `type` IS NOT NULL";

    db.query(req, query, function(err, results, fields) {
      if (err) {
        res.json({success: false, message: err.code, rows: []});
        return;
      }
      
      if (results.length>0)
        res.json({success: true, rows: results, results: results.length});
      else
        res.json({success: false, rows: [], message: 'Not found!'});
    });
};

exports.list_category_config = function(req, res) {
  var filename = req.param('filename');

  var query = "SELECT DISTINCT category FROM vConfig WHERE filename = '" + filename + "' ORDER BY category";

  db.query(req, query, function(err, results, fields) {
    if (err) {
      res.json({success: false, message: err.code, rows: []});
      return;
    }
    
    if (results.length > 0)
      res.json({success: true, rows: results, results: results.length});
    else
      res.json({success: false, rows: [], message: 'Not found!'});
  });
}

exports.getparents = function(req, res) {    
  var item_id = req.param('item_id');
  var query = "SELECT DISTINCT `id`, `type`, `name`, `parent_id`, `parent_name` FROM vItems WHERE id IN(" + item_id + ")";

  db.query(query, function(err, results, fields) {
    if (err) {
      res.json({success: false, message: err.code, rows: []});
      return;
    }
    
    if(results.length > 0)
      res.json({success: true, rows: results, results: results.length});
    else
      res.json({success: false, rows: [], message: 'Not found!'});
  });
}