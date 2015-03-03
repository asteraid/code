exports.index = function(req, res) {
    res.redirect('install/step1');
};

exports.step1 = function(req, res) {
    if(config.db && !config.db.database) {
      var db = require('../modules/db');
      db.checkConnect({user: config_default.db_client.user, password: config_default.db_client.password}, function(err) {
        if (!err)
          res.render('install/step1_first_install', {title: config.application_name, sessionID: req.sessionID, default_values: config_default.db_client});
        else
          res.render('install/step1', {title: config.application_name, sessionID: req.sessionID, default_values: config_default.db_client});
      });
        
    } else
        res.redirect('install/step2');
};

exports.step2 = function(req, res) {
    if(config.db && config.db.database)
        res.render('install/step2', {title: config.application_name, sessionID: req.sessionID});
    else
        res.redirect('install/step1');
};

exports.import = function(req, res) {
    if(config.db && !config.db.database) {
        res.render('install/import', {title: config.application_name, sessionID: req.sessionID});
    } else res.redirect('/');
};