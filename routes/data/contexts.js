var db = require('../../modules/db');

exports.get_path = function (req, res) {
  var params_in = req.param('ids');
  var params_out = [];
  var type = req.param('type') === undefined ? 'contexts' : req.param('type');

	//определяем в url имя хоста и заменяем его на ''
	var regexp = /^(https|http):\/\/[a-zA-Z0-9:\.-]*\//;
	params_in = params_in.replace(regexp, '').split('/');

  var default_params = {contexts:{path: '/contexts', name: 'Contexts'}, rules:{path: '/rules', name: 'Rules'}};

  for (i = 0; i < params_in.length; i++) {
    var temp = params_in[i];
    if (!isNaN(parseInt(temp)))
      params_out.push(temp);
  }

  params_out = params_out.join();

  var query = 'SELECT DISTINCT id, name, comment FROM vItems WHERE id IN (' + params_out + ') ORDER BY Field(id, ' + params_out + ')';
  db.query(req, query, function(err, results, fields) {
    if (err) {
      res.json({success: false, rows: [], message: err.code});
      return;
    }

    if (results.length > 0) {
      //если больше 1 записи, то это контекст, т. к. рул запрашивается с 1 id
      if (results.length > 1) type = 'contexts';

      var path        = default_params[type].path;
      var jsonObject  = [{id: 0, name: default_params[type].name, href: path}];
      var temp        = {};

      results.forEach(function(item) {
        temp = {};
        path += '/' + item.id;
        temp['id']      = item.id;
        temp['name']    = item.name;
        temp['href']    = path;
        jsonObject.push(temp);
      });
    }

    res.json({success: true, path: jsonObject});
  });
}

exports.list = function (req, res) {
  var query = "SELECT DISTINCT `id`, `name`, `type`, `comment` FROM `vItems` WHERE (`type`='context' OR `type`='rule') AND `visible` = 1 ORDER BY `name` ASC";
  db.query(req, query, function (err, results, fields) {
    if (err) {
      res.json({success: false, rows: [], message: err.code});
      return;
    }
    
    if (results.length > 0)
      res.json({success: true, rows: results, results: results.length});
    else
      res.json({success: false, rows: [], message: 'Not found items'});
  });
}

exports.include = function (req, res) {
  var item_id = req.param('item_id');
  var parent_id = req.param('parent_id');
  var query = "CALL item_include(?, ?, @result); SELECT @result";
  
  db.query(req, query, [item_id, parent_id], function(err, results, fields) {
    if (err) {
      res.json({success: false, rows: [], message: err.code});
      return;
    }

    var result = results[1][0]['@result'];
    if (result)
      res.json({success: true,  results: result , message: "Success!"});
    else
      res.json({success: false,  results: result, message: "Not saved!"});
  });
}


exports.delete_included = function (req, res) {
  var item_id   = req.param('item_id');
  var parent_id = req.param('parent_id');

  var query = "CALL context_delete_included(?, ?, @result); SELECT @result";
  db.query(req, query, [item_id, parent_id], function(err, results, fields) {
    if (err) {
      res.json({success: false, rows: [], message: err.code});
      return;
    }
    
    var result = results[1][0]['@result'];
    if (result)
      res.json({success: true, results: result , message: "Success!"});
    else
      res.json({success: false, results: result, message: "Not saved!"});
  });
}

exports.save_context = function (req, res) {
  var name        = req.param('name');
  var name_old    = req.param('name_old');
  var comment     = req.param('comment');
  var id          = req.param('id');
  var action      = req.param('action');

  if (!name) {
    res.json({success: false, message: "\"Name\" is empty. Please enter the \"Name\"" });
    return false;
  }

  //save context
  var save_context = function() {
    //create_context
    var sql = new getSQL({
      id: id,
      itemtype: "context",
      filename: "extensions.conf",
      name: name,
      comment: comment,
      out_2: "@id_context"
    });
            
    if ((name_old !== undefined) && (name != name_old)) {
      var query_update = [
        'UPDATE `config` SET `var_val` = ? WHERE `filename` = "sip.conf" AND `var_name` = "context" AND `var_val` = ?',
        'UPDATE `config_user` SET `var_val` = ? WHERE `filename` = "sip.conf" AND `var_name` = "context" AND `var_val` = ?'
      ].join(';');
      db.query(req, query_update, [name, name_old, name, name_old], function(err, results, fields) {});
    }

    var query = sql.save_item() + ';' + 'SELECT @result, @id_context';

    db.query(req, query, function(err, results, fields) {
      if (err) {
        res.json({success: false, message: err.code});
        return;
      }

      var result = results[1][0]['@result'];
      var id_context = results[1][0]['@id_context'];
      if (result)
        res.json({success: true,  results: result , id_context: id_context, name: name, message: "Context " + name + " saved success!"});
      else
        res.json( {success: false,  results: result, message: "Not saved!" });
    });             
    // end create_context
  }
  
  if (action == 'create' || action == 'copy') {
  //проверяем есть ли такой контекст у клиента
    var query = "SELECT name FROM vItems WHERE name = ? AND type IN ('rule','context')";
    db.query(req, query, [name], function(err, results, fields) {
      if (err) {
        res.json({success: false, message: err.code});
        return;
      }

      if (results.length == 0)
        save_context();
      else
        res.json({success: false, message: "Context or Rule " + name + " already exists!"});
    });
  } else save_context();
}

exports.load_context = function (req, res) {
  var id = req.param('id');
  var query = 'SELECT * from vItems where id = ?';

  db.query(req, query, [id], function (err, results, fields) {
    if (err) {
      res.json({success: false, message: err.code});
      return;
    }
      
    if(results.length > 0)
      res.json({success: true, data: results[0]});
    else
      res.json({success: false, message: 'Not found ext'});
  });
}

exports.order_update = function(req, res) {
  var contexts =  req.param('contexts');
  var order_update = function(err, index, callback) {
    if (err) {
      callback(err);
      return;
    }
            
    if (index < contexts.length) {
      var query   = "CALL order_update(?, ?, ?, @result)";
      var values  = [contexts[index].item_id, contexts[index].parent_id, contexts[index].order];

      db.query(req, query, values, function (err, results, fields) {
        order_update(err, index + 1, callback);
      });
    } else
      callback();
  };

  order_update(null, 0, function(err) {
    if (!err)
      res.json({success: true});
    else
      res.json({success: false, message: err.code});
  });
}

exports.delete = function(req, res) {
	var id = req.param('id');
  var query = 'CALL context_delete(?, @result); SELECT @result';

  db.query(req, query, [id], function(err, results, fields) {
    if (err) {
      res.json({success: false, message: err.code});
      return;
    }
			
    var result = results[1][0]['@result'];
    if (result)
      res.json({success: true, message: "Context deleted!"});
    else
      res.json({success: false, message: "Context isn't deleted! Remove all the items of context."});
  });
}

exports.getWhereIncluded = function(req, res) {
  var id = req.param('id');
  var query = 'SELECT DISTINCT `ci`.`name` FROM `config_items` `ci` JOIN `config_relations` `cr` ON (`ci`.`id` = `cr`.`parent_id` AND `cr`.`item_id` = ?)';

  db.query(req, query, [id], function(err, results, fields) {
    if (err) {
      res.json({success: false, message: err.code});
      return;
    }
    
    var contexts = [];
    if (results.length > 0) {
      results.forEach(function(item) {
        contexts.push(item.name);
      });
    }
    
    res.json({success: true, contexts: contexts.join(', ')});
  });
}