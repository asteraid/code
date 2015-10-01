var db = require('../../modules/db');

exports.check_password = function(req, res) {
  var password  = req.param('password_o');
  var user_id   = req.session.user_id;
    
  var query = 'SELECT * FROM `users` WHERE `id`= ? AND `password` = md5(?)';
  
  db.query(req, query, [user_id, password], function(err, results, fields) {
    if (err) {
      res.json(false);
      return;
    }

    if (results.length == 1)
      res.json(true);
    else
      res.json('Wrong password');            
  });
}

exports.save_password = function(req, res) {
  var password_o  = req.param('password_o');
  var password_n1 = req.param('password_n1');
  var user_id     = req.session.user_id;
    
  var query = 'UPDATE `users` SET `password` = md5(?) WHERE `id` = ? AND `password` = md5(?)';
  db.query(req, query, [password_n1, user_id, password_o], function(err, results, fields) {
    if (err) {
      res.json({success: false, message: err.code});
      return;
    }
    
    res.json({success: true, message: 'Password changed successfully'});
  });
}