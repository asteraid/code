var db = require('../modules/db');

exports.index = function(req, res) {
	if(config && config.db && config.db.database) {      
    var query = "SELECT COUNT(*) `rows` FROM `users`";
    db.query(query, function(error, results) {
      if (!error) {
        if (results[0].rows > 0)
          res.render('auth', {title: config.application_name, sessionID: req.sessionID});
        else
          res.redirect('install/step2');
      }
    });
  } else {
    res.redirect('install/step1');
  }
}