exports.save_view_setting = function (req, res) {
   if ( req.session.dbuser && req.session.password ){
    var conf = {};
    conf.user = req.session.dbuser;
    conf.password = req.session.password;
    conf.host = config.db.host;
    conf.database = "a_cdr";
    conf.port = config.db.port;

    var db = mysql.createConnection(conf);
    db.connect(function(err) {
              // connected! (unless `err` is set)
    });
   
    var user_view = "view_cdr"; // TODO взять из конфига
    
    var password = req.param('password'),
        network = req.param('network'),
        limit = req.param('limit');

    var str_limit = ""
    if ( limit > 0 )
	str_limit = "LIMIT "+limit;
    
    var query = "call create_user_view('"+password+"','"+network+"','"+limit+"', @res)";
    db.query(query, function (err, results, fields) {
       if ( !err ){
	    var query = "select @res as res";
		db.query( query, function (err,results,fields){
			console.log(results);
			if( results[0].res ){
			    res.json( {success: true});
			}
			else 
			   res.json({success: false, message: "Error create view." });  
		       
		        db.destroy();
		});
       }
       else {
           res.json({success: false, message: err.code });
	   db.destroy();
       }
    });
    
   }
};

exports.cdr_to_xls = function(req, res) {
  var db        = new database(req, res);
  var date_from = req.param('date_from');
  var date_to   = req.param('date_to');
  var where     = '';
  var fields    = [];
  
  if (date_from != "")
    where = "start >= '" + date_from + " 00:00:00'";
        
  if (date_to != "") {
    if ( where != "" )
      where += " AND ";
    where += " start <= '" + date_to + " 23:59:59'";
  }

  if (db.connect)
    getColumns();
  else
    res.json({ success: false, rows: [], message: 'Error sessions'});
  
  function getColumns() {
    var query = 'SHOW COLUMNS FROM `' + config.cdr.database + '`.`cdr`';
    db.connect.query(query, onGetData);
  }
  
  function onGetData(err, results) {
    if (!err) {
      fields = results.map(function(item) {return item.Field;});
      
      var query = [
        'SELECT ',
        fields.map(function(item) {return '`' + item + '`';}),
        ' FROM ',
        '`' + config.cdr.database + '`.`cdr`',
        ' WHERE ',
        where
      ].join('');

      db.connect.query(query, onCreateCsv);
    }
  }
  
  function onCreateCsv(err, results) {
    if (!err) {
      var csv = fields.map(function(item) {return "'" + item + "'";}).join(';');
      
      for(var i=0,length = results.length; i<length; i++) {
        var row = [];
        for (var key in results[i]){
            if(results[i].hasOwnProperty(key)) {
                if(results[i][key] == null) row.push('');
                else row.push(results[i][key].toString());
            }
        }
        csv += row.join(';') + "\n";
      }
      
      to_csv(csv);
      db.destroy();
    }
  }
  
  function to_csv(data) {
    res.set('Content-Type', 'application/octet-stream');
    res.set('Content-disposition', 'attachment; filename=export.csv');
    res.send(data);
  }
};