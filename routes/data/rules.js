var db = require('../../modules/db');

exports.save = function (req, res) {
  var action = req.param('action');
  var id = req.param('id');
  var context_id = req.param('context_id') || 'NULL';
  var name = req.param('name');
  var comment = req.param('comment');
  var mask = req.param('mask');

  //save
  var save_rule = function() {
    var query = "CALL save_rule("+id+",'"+name+"',"+context_id+",'"+comment+"','"+mask+"', @result, @id_rule); SELECT @result, @id_rule";
    
    db.query(req, query, function (err, results, fields) {
      if (err) {
        res.json({success: false, message: err.code});
        return;
      }
      
      var result  = results[1][0]['@result'];
      var id_rule = results[1][0]['@id_rule'];

      if (result)
        res.json({success: true,  results: result , id_rule: id_rule, message: "Rule " + name + " saved success!"});
      else
        res.json({success: false,  results: result, message: "Rule not saved!"});  
    });
  }
  //end save
   
  if (action == 'create' || action == 'copy') {
    var query = "SELECT `name` FROM vItems WHERE `name` = '" + name + "' and type in ('rule','context')";
    
    db.query(req, query,function(err, results, fields) {
      if (err) {
        res.json({success: false, message: err.code});
        return;
      }
      
      if (results.length == 0)
        save_rule();
      else
        res.json({success: false, message: "Rule or Context " + name + " alredy exists!"});
    });
  } else
    save_rule();
}

exports.load = function(req, res) {
  var id = req.param('id');
  var query = "SELECT * FROM vItemsConf WHERE item_id='"+id+"'";

  db.query(req, query, function(err, results, fields) {
    if (err) {
      res.json({success: false, message: err.code});
      return;
    }
    
    if (results.length > 0) {
      var jsonObject = [];
      results.forEach(function(item) {
        var temp = {};
        temp['name']         = item.name;
        temp['value']        = item.value;
        temp['param_name']   = item.param_name;
        temp['param_value']  = item.param_value;
        jsonObject.push(temp);
      });

      res.json({success: true, data: jsonObject});
    } else
      res.json({success: false, message: 'Not found rule'});
  });  
}

exports.is_included = function(req, res) {
  var id = req.param('rule_id');
  var query = "SELECT COUNT(*) `count` FROM `config_relations` WHERE item_id="+id;

  db.query(req, query, function(err, results, fields) {
    if (err) {
      res.json({success: false, message: err.code});
      return;
    }
    
    if (results.length > 0)
      res.json({success: true, count: results[0].count});
    else
      res.json({success: false, message: 'Not found rule'});
  });
}

exports.delete = function (req, res) {
  var item_id = req.param('item_id');
  var parent_id = req.param('parent_id');
  var name = req.param('name');
  var included = req.param('included');

  if (included == 1)
    var query = "CALL context_delete_included(" + item_id + ", " + parent_id + ", @result);";
  else
    // delete callflows and configs
    var query = "CALL delete_rule(" + item_id + ", @result);";
        
    query += 'SELECT @result';
    
    db.query(req, query, function (err, results, fields) {
      if (err) {
        res.json({success: false, message: err.code});
        return;
      }
      
      var result = results[1][0]['@result'];
      
      if (result)
        res.json({success: true,  results: result , message: "Rule deleted success!"});
      else
        res.json({success: false,  results: result, message: "Rule not deleted!"});
    });
}