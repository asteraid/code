crypto = require('crypto');
var db = require('../../modules/db');

exports.users_list = function(req, res) {
  var query = "SELECT id, login, name, surname, secname FROM users";
  db.query(req, query, function(err, results, fields) {
    if (err) {
      res.json({success: false, message: err.code});
      return;
    }

    if (results.length > 0)
      res.json( {success: true, rows: results, results: results.length});
    else
      res.json( {success: false, rows: [], message: 'Users not found'});
  });
}

exports.save_user_data = function(req, res) {
  var login = req.param('login');
  var name = req.param('name');
  var password = req.param('password');
  var surname = req.param('surname');
  var secname = req.param('secname');
  var action = req.param('action');
  var id = req.param('id');
  var user_type = req.param('user_type');
  var user_modules = req.param('user_modules').split(',');
		
  if (password === undefined || password == '')
    res.json({success: false, message: "Enter user password please!"});

		//create user
  if (action == 'create') {
    var password_hash = crypto.createHash('md5').update(password).digest("hex");
    var query = "INSERT INTO users (login, password, name, surname, secname, user_type_id) " + 
      "VALUES ('" + login + "', '" + password_hash + "', '" + name + "' , '" + surname + "', '" + secname + "', '" + user_type +"') ";

    db.query(req, query, function(err, results, fields) {
      if (err) {
        res.json({success: false, message: err.code});
        return;
      }

      var user_id = results.insertId;
      update_user_modules(user_modules, user_id, req, res);

      res.json({success: true, message: "User " + login + " successfuly saved!"});
    });
  } else {//edit user
    if (typeof(id) != undefined && parseInt(id)) {
      var user_data = {};
			user_data['login'] = login;

			if (password != '*********')
        user_data['password'] = crypto.createHash('md5').update(password).digest("hex");

      user_data['name'] = name;
      user_data['surname'] = surname;
      user_data['secname'] = secname;
      user_data['user_type_id'] = user_type;
      
      var query_fields = '';
      
      for (var field_name in user_data) {
        var value = user_data[field_name];
        query_fields += field_name + " = '" + value + "', ";
      }
      
      query_fields = query_fields.trim();
      query_fields = query_fields.substr(0, query_fields.length - 1);
      var query = "UPDATE users SET " + query_fields + " WHERE id = " + id;

      db.query(req, query, function(err, results, fields) {
        if (err) {
          res.json({success: false, message: err.code});
          return;
        }

        update_user_modules(user_modules, id, req, res);
        res.json({success: true, message: "User " + login + " successfuly saved!"});
      });
    } else
				res.json({success: false, message: "Incorrect ID"});
  }
}

function update_user_modules(user_modules, user_id, req, res){
  //Update user modules;
  //Delete all from user_settings
  var query = "DELETE FROM user_settings WHERE user_id = " + user_id + " AND module = 'menu'";
		
  db.query(req, query, function(err, results, fields) {
    if (err) {
      return false;
    }
			
    //Insert new menu items
    if (user_modules.length) {
      var query = "INSERT INTO user_settings (user_id, module, category, var_name, var_val, module_id) VALUES ";
					
      var values_arr = [];
      for (var i in user_modules) {
        var module_id = user_modules[i];
        values_arr.push("(" + user_id + ", 'menu', 'item', 'settings', '', " + module_id + ")");
      }
      
      query += values_arr.join();
					
      db.query(req, query, function(err, results, fields) {
        if (err) {
          return false;
        }
        
        return true;
			});
    } else 
      return false;
  });
}

exports.get_user_data = function (req, res) {
  var id = req.param('id');
  var query = "SELECT u.id, u.login, '*********' AS password, u.name, u.surname, u.secname, GROUP_CONCAT(us.module_id SEPARATOR ',') AS user_modules, user_type_id as user_type FROM users u LEFT JOIN user_settings us ON u.id = us.user_id AND us.module = 'menu' WHERE u.id='" + id + "'";

  db.query(req, query, function(err, results, fields) {
    if (err) {
      res.json({success: false, message: err.code});
      return;
    }

    if (results.length > 0) {
      var data = results[0];

      if (data.user_modules) {						
        data.user_modules = data.user_modules.toString().split(',');
        
        for (i in data.user_modules)
          data.user_modules[i] = parseInt(data.user_modules[i]);
      } else
        data.user_modules = [];

      res.json({success: true, data: data});
    } else
      res.json({success: false, message: 'User not found'});
  });
}

exports.delete_user = function(req, res) {
  var id    = req.param('id');
  var login = req.param('login');

  //delete user from users table
  var query = "DELETE FROM users WHERE id = " + id;

  db.query(req, query, function (err, results, fields) {
    if (err) {
      res.json({success: false, message: err.code});
      return;
    }

    query = "DELETE FROM user_settings WHERE user_id = " + id;
    
    db.query(req, query, function(err, results, fields) {
      if (err) {
        res.json({success: false, message: err.code, results: results});
        return;
      }

      res.json({success: true,  results: results , message: "User " + login + " successfuly deleted!"});
    });
  });
}

exports.get_modules_list = function(req, res) {
  var query = "SELECT * FROM modules WHERE active = 1";
  
  db.query(req, query, function(err, results, fields) {
    if (err) {
      res.json({success: false, message: err.code});
      return;
    }

    if (results.length)
      res.json({success: true, rows: results});
    else
      res.json({success: false, message: "The are no available modules!"});
  });
}

exports.get_user_types_list = function(req, res) {
  var query = "SELECT * FROM user_types";
  
  db.query(req, query, function(err, results, fields) {
    if (err) {
      res.json({success: false, message: err.code});
      return;
    }

    if (results.length)
      res.json({success: true, rows: results});
    else
      res.json({success: false, message: "No users types found!"});
  });
}