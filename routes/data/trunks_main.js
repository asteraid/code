var db = require('../../modules/db');

exports.get_itemid = function (req, res) {
  var item_name = req.param('item_name');
  var query = "SELECT GROUP_CONCAT(`item_id` SEPARATOR ',') `item_id` FROM `vItemsConf`, `node` WHERE `name` = 'trunk_name' AND `value` = ? AND `commented` = 1 GROUP BY `name`";

  db.query(req, query, [item_name], function(err, results, fields) {
    if (err) {
      res.json({success: false, rows: [], message: err.code});
      return;
    }

    if (results.length > 0)
      res.json({success: true, rows: results, results: results.length});
    else
      res.json({success: true, rows: [], message: 'Not found!'});
  });
}

exports.save_trunk = function (req, res) {
  var name = req.param('name');
  var comment = req.param('comment');
  var id = req.param('id');
  var params = req.param('params');
  var values = req.param('values');
  var node = req.param('node');
  var custom_type = req.param('custom_type');
  var commented = req.param('commented');
  var action = req.param('action');
  var filename = 'sip.conf';

  switch(custom_type) {
    case 'OOH323':
      filename = 'ooh323.conf';
    break;
    case 'IAX2':
      filename = 'iax.conf';
    break;
  }

  if (!name) {
     res.json({success: false, message: "\"Name\" is empty. Please enter the \"Name\"" });
     return false;
  }
  
  // save trunk
  var save_trunk = function(){
    // create_trunk
    var sql = new getSQL({
        id: id,
        itemtype: "trunk",
        filename: filename,
        name: name,
        comment: comment,
        params: params,
        values: values,
        node: node,
        custom_type: custom_type,
        commented: commented
    });
    
    var query = sql.save_item() + 'SELECT @result, @id_trunk';
    //console.log(query);
    db.query(req, query, function(err, results, fields) {
      if (err) {
        res.json({success: false, message: err.code});
        return;
      }

      var result = results[1][0]['@result'];
      var id_trunk = results[1][0]['@id_trunk'];
      
      if (result)
        res.json({success: true, results: result , id_trunk: id_trunk, message: "Trunk " + name + " saved!"});
      else
        res.json({success: false, results: result, message: "Trunk not saved!"});
    });
    // end create_trunk
  }

  if (action == 'create' || action == 'copy') {
    //проверяем есть ли такой транк у клиента
    var query = "SELECT `name` FROM `vItems` WHERE `type` = 'trunk' AND `name` = ?";
    db.query(req, query, [name], function (err, results, fields) {
      if (err) {
        res.json({success: false, message: err.code});
        return;
      }

      if (results.length == 0)
        save_trunk();
      else
        res.json({success: false, message: "Trunk " + name + " exists!!!"});
    });
  } else
    save_trunk();
}

exports.load_trunk = function (req, res) {
  var id      = req.param('id');
  var action  = req.param('action');
  var query   = "SELECT `name`, `expert`, `commented`, GROUP_CONCAT(`value` SEPARATOR ',') `value`, `node` FROM `vItemsConf` WHERE `item_id` = ? GROUP BY `name`, `expert`, `commented`, `node`";

  db.query(req, query, [id], function (err, results, fields) {
    if (err) {
      res.json({success: false, message: err.code});
      return;
    }
    
    if (results.length > 0) {
      var jsonObject = [];
      results.forEach(function(item, index) {
        if (!jsonObject[0])
          jsonObject.push({name: 'commented', value: item.commented == 0 ? 'no' : 'yes', expert: 0});
          
        var temp = {};
        temp['name'] = item.name;
        temp['value'] = item.value;
        temp['expert'] = item.expert;
        jsonObject.push(temp);
          
        if (index == 0)
          jsonObject.push({name: 'node', value: item.node, expert: 0});
      });

      res.json( { success: true, data: jsonObject });
    } else
      res.json({success: false, message: 'Not found trunks'});
  });
}

exports.delete_trunk = function (req, res) {
	var id = req.param('id');
  var name = req.param('name');

  var del_trunk = function() {
    //delete trunk
    var query = "CALL delete_item(?, @result); SELECT @result";

    db.query(req, query, [id], function(err, results, fields) {
      if (err) {
        res.json({success: false, message: err.code});
        return;
      }

      var result = results[2][0]['@result'];
      if (result)
        res.json({success: true, results: result , message: "Trunk " + name + " deleted!"});
      else
        res.json({success: false, results: result, message: "Trunk not deleted!"});							
    });         
    //end delete trunk
  }

  del_trunk();
}