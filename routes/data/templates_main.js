var db = require('../../modules/db');

exports.list = function (req, res) {
  var type = req.param('type');
  var query = "SELECT DISTINCT * FROM vItems WHERE type = '" + type + "'";

  db.query(req, query, function(err, results, fields) {
    if (err) {
      res.json({success: false, message: err.code});
      return;
    }
    
    if (results.length > 0)
      res.json({success: true, rows: results, results: results.length});
    else
      res.json({success: false, rows: [], message: "Not found templates"});
  });
}

exports.ext_templates = function (req, res) {
  var query = "SELECT id, name, company_id, busylevel, allow, dtmfmode, deny, permit from vTemplatesConf";
  
  db.query(req, query, function(err, results, fields) {
    if (err) {
      res.json({success: false, message: err.code});
      return;
    }
    
    if(results.length > 0)
      res.json({success: true, rows: results, results: results.length});
    else
      res.json({success: false, message: 'Not found templates'});      
  });
}

exports.save = function(req, res) {
  var name = req.param('name');
  var comment = req.param('comment');
  var id = req.param('id');
  var params = req.param('params');
  var values = req.param('values');
  var action = req.param('action');

  if (!name) {
    res.json({success: false, message: "\"Name\" is empty. Please enter the \"Name\"" });
    return false;
  }

  // сохранение шаблона
  var save_template = function(){
    // create_ext
    var sql = new getSQL({
      id: id,
      itemtype: "template",
      filename: "sip.conf",
      name: name,
      comment: comment,
      params: params,
      values: values,
      out_2: "@id_tmpl"
    });
    
    var query = sql.save_item() + 'SELECT @result, @id_tmpl';
    
    db.query(req, query, function(err, results, fields) {
      if (err) {
        res.json({success: false, message: err.code});
        return;
      }

      var result  = results[1][0]['@result'];
      var id_tmpl = results[1][0]['@id_tmpl'];

      if (result)
        res.json({success: true,  results: result , id_tmpl: id_tmpl, message: "Template "+name+" saved success!"});
      else
        res.json({success: false,  results: result, message: "Template not saved!"});
    });            
    // -- end create_ext
  };

  if (action == 'create' || action == 'copy') {
    //проверяем есть ли такой шаблон у клиента
    var query = "SELECT name FROM vItems WHERE name = ? AND type = 'template'";

    db.query(req, query, [name], function(err, results, fields) {
      if (err) {
        res.json({success: false, message: err.code});
        return;
      }
      
      if (results.length == 0)
        save_template();
      else 
        res.json({success: false, message: "Template " + name + " already exists!"});
    });
  } else
    save_template();

}

exports.load = function (req, res) {    
  var id    = req.param('id');
  var query = "SELECT `name`, `expert`, GROUP_CONCAT(`value` SEPARATOR ',') `value` FROM `vItemsConf` WHERE `parent_id` = ? GROUP BY `name`";
  
  db.query(req, query, [id], function(err, results, fields) {
    if (err) {
      res.json({success: false, message: err.code});
      return;
    }

    if (results.length > 0) {
      var jsonObject = [];
      results.forEach(function(item) {
        var temp = {};
        temp['name'] = item.name;
        temp['value'] = item.value;
        temp['expert'] = item.expert;
        jsonObject.push(temp);
      });
      res.json({success: true, data: jsonObject});
    } else
      res.json({success: false, message: "Not found rule"});
  });
}

exports.delete = function (req, res) {
  var id = req.param('id');
  var name = req.param('name');

  var query = "CALL delete_item(?, @result); SELECT @result";

  db.query(req, query, [id], function(err, results, fields) {
    if (err) {
      res.json({success: false, message: err.code});
      return;
    }

    var result = results[2][0]['@result'];
    if (result)
      res.json({success: true,  results: result , message: "Template "+name+" deleted success!"});
    else
      res.json({success: false,  results: result, message: "Template not deleted!"});
  });
}