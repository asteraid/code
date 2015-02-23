var logger = require('../../modules/logger');
exports.login = function(req, res) {
  var db = mysql.createConnection(config.db);
  db.connect();
	var ip    = req.ip;
	var sid   = req.sessionID;
	var user  = req.param('user');
	var pass  = req.param('pass');
	var query = "CALL get_userId('"+user+"','"+pass+"', @res, @userId)";
	db.query(query, function (err,results,fields) {
		var query = "select @res as res,@userId as user_id";
		db.query( query, function (err,results,fields){
			if(results[0].res) {
        var dbuser  = config.db.user;
        var user_id = results[0].user_id;
				var conf    = {};
        
				conf.user = dbuser;
				conf.password = config.db.password;
				conf.host = config.db.host;
				conf.database = config.db.database;
				conf.port = config.db.port;
				
				//get user modules
				//console.log('Getting user modules...');
				var query = "SELECT us.module_id, m.href FROM user_settings us JOIN modules m ON m.id = us.module_id WHERE user_id = " + results[0].user_id + " AND us.module = 'menu'";
				//console.log(query);
				
				db.query( query, function (err, user_modules, fields){
					//console.log('user_modules:', user_modules);
					
					
					//console.log('Getting user_type_id');
					//Get user type
					var query = "SELECT user_type_id FROM users WHERE id = " + user_id;
					//console.log(query);
					db.query(query, function(err, results, fields){
						
						if(!err){
						
							var user_type_id = results[0]['user_type_id'];
						
							req.session.user = user;
							req.session.user_id = user_id;
							req.session.user_type_id = user_type_id;
							//req.session.company = 'zzzzz';
							//req.session.companyId = 'c120';
							req.session.dbuser = dbuser;
							req.session.password = conf.password;
							req.session.user_modules = user_modules;
							
              logger.login(req, {user: user, success: true});
							res.jsonp( {success: true,
								data: {
									user: user,
									sid: sid
								}
							});
						}
						else {
              logger.login(req, {user: user, success: false});
							res.jsonp({success: false, message: err});
							console.log(err);
						}
						db.destroy();
					})
					
				});
			}
			else
            {
        logger.login(req, {user: user, success: false});
				res.jsonp( {success: false,
		  			mess: '' });
            }
            

        });
	});
};

// Закрытие сессии от вебсервера
exports.logout = function(req, res){
	var ip = req.ip;
	if( req.session.user ) {
		var sid = req.sessionID,
			user = req.session.user,
			user_ip = req.param('ip');
		//destroy session
		req.session.destroy(function() {});
		//res.json({success: true});
    logger.logout(req, {user: user});
		res.redirect('/auth');
	} else res.json({success: false});
};
