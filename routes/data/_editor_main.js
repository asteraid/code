exports.list_configs = function(req, res){
    var db = new database(req, res);
    if(db.connect) {
		var query = "SELECT DISTINCT `filename` FROM `vConfigAll` ORDER BY `editortabname` ASC";
		db.connect.query(query, function (err, results, fields) {
	    	var configs = [];
			var custom_configs = ['extensions.conf', 'extensions-custom.conf', 'sip-custom.conf'];
		
			if(results.length == 0){
				res.json({success: true, configs: custom_configs});
				db.destroy();
			}
		
			results.forEach(function(row){
				configs.push(row['filename']);
		
			});
		
			// check if config files have customs
			custom_configs.forEach(function(custom_config){
				var custom_config_exists = false;

				results.forEach(function(row){
					if(row['filename'] == custom_config){
						custom_config_exists = true;
						return;
					}
				});
			
				// append custom config if not exists
				if(! custom_config_exists){
					configs.push(custom_config);
		            configs.sort();
				}
			});

		    if(!err) {
		        if(results.length>0) {
		            res.json({success: true, configs: configs});
					db.destroy();
		        }
		    } else {
		    	res.json({success: false, message: 'db error', 'err': err});
				db.destroy();
		    }
		});
	} else res.json({success: false, message: 'Error sessions'});
}

exports.get_context_id = function(req, res) {
	var db = new database(req, res);
    if(db.connect) {
		var context_name = req.param('context_name');
		var query = "SELECT `id` FROM `config_items` WHERE `type`='context' AND `name`='" + context_name + "'";
        db.connect.query(query, function (err, results, fields) {
            if(!err) {
                if(results.length>0) {
                    res.json({success: true, id: results[0].id});
		            db.destroy();
                } else {
                    var sql = new getSQL({
                        itemtype: "context",
                        name: context_name,
                        out_2: "@id_tmpl"
                    });

                    var query = sql.save_item();

			        db.connect.query(query, function (err, results, fields) {
						if(!err) {
							db.connect.query("SELECT @result, @id_tmpl", function (err, results, fields) {
								var result = results[0]['@result'];
								var id_tmpl = results[0]['@id_tmpl'];
								if(result)
									res.json({success: true,  id: id_tmpl});
								else
									res.json({success: false});
								db.destroy();
							});
						} else res.json({success: false, message: err.code });
					});
				}
            } else res.json({success: false, message: err.code});
        });
	} else res.json({success: false, message: 'Error sessions'});
};

exports.get_config = function(req, res) {
	var db = new database(req, res);
    if(db.connect) {
		var config_name = req.param('config_name');

		if(config_name == 'extensions.conf' || config_name == 'extensions-custom.conf')
		    var query = "SELECT * FROM `vExtensionsConfAll` WHERE editortabname='" + config_name + "' ORDER BY `cat_metric`, `var_metric`";
		else if(config_name == 'sip.conf' || config_name == 'sip-custom.conf')
		    var query = "SELECT * FROM `vSipConfAll` WHERE `editortabname`='" + config_name + "' ORDER BY `cat_metric`, `var_metric`";
		else
		    var query = "SELECT * FROM `vConfigAll` WHERE `editortabname`='" + config_name + "' ORDER BY `cat_metric`, `var_metric`";

		db.connect.query(query, function (err, results, fields) {
            var editor              = '';
            var category            = '';
			var old_category        = '';
			var key_val_separator   = ' = ';
            var msg_attention       = ' \
; ------------------------------ ATTENTION ---------------------------\n \
; This configuration is automatically created. You can not change it manually.\n \
; But you can OVERRIDE any section of this configuration in the *-custom.conf\n \
; window by section created with the same name. Or you can create a section\n \
; with a new name and it will be available for the system. Section with names\n \
; begins with __ (double underscore) are not available for the include menu\n \
; ---------------------------------------------------------------------\n \
\n\n';

	        if(!err) {
				var prep_inc    = '';
                var post_inc    = '';
                var contexts_id = [];

                switch(config_name) {
                    case 'extensions.conf':
                        prep_inc = msg_attention;
    					post_inc = '\n\n#include extensions-custom.conf\n\n';
                    break;
                    case 'sip.conf':
                        prep_inc = msg_attention;
    					post_inc = '\n\n#include sip-custom.conf\n\n';
                    break;
                }

	            if(results.length > 0) {
    	        	results.forEach(function(row){
		        		if(old_category != row['category']) {
				    		if(old_category != '') category = '\n';

                            category += '['+row['category']+']\n';
				    		old_category = row['category'];

                            if(config_name == 'extensions-custom.conf')
                                contexts_id.push({name: row['category'], id: row['cat_metric']});
		        		} else category = '';
                        
		        		switch(row['var_name']){
		        			case 'exten':
		        			case 'same':            			
		        			case 'include':
		        				key_val_separator = ' => ';
		        			break;
		        			default:
		        				key_val_separator = ' = ';
		        		}
                        
                        editor += category + row['var_name'] + key_val_separator + row['var_val'] + '\n';
            		});

					res.json({ success: true, config_name: config_name, contexts_id: contexts_id, content: editor});
					db.destroy();
				} else {
					res.json({ success: true, config_name: config_name, contexts_id: contexts_id, content: editor});
					db.destroy();
				}
                
        } else res.json({ success: false, message: 'db error', 'err': err, query: query });
    });
	}
}

exports.save_config = function(req, res) {
	var config_name     = req.param('config_name');
  var config_content  = req.param('config_content');
  var deleted         = req.param('deleted');
  var node            = req.param('node') || 'ALL';
	
    var db = new database(req, res);
    if(db.connect) {
        var query = [
          'CALL insert_config(',
            [
              mysql.escape(config_content),
              ['\'', config_name.replace('-custom', ''), '\''].join(''),
              ['\'', node, '\''].join(''),
              '@result'
            ].join(','),
          ')'
        ].join('');
        /*"call insert_config("+ mysql.escape(config_content) +", '" + config_name.replace('-custom', '') + "', @result)";*/
        console.log(query);
		db.connect.query(query, function (err, results) {
			if(!err) { 
                db.connect.query("SELECT @result", function (err, results, fields) {
                    var result = results[0]['@result'];
                    if(result) {
                        res.json({success: true,  results: result , message: "Config saved"});
                    } else {
                        res.json({success: true,  results: result, message: "Config not saved"});
                    }

                    if(deleted && deleted != 0) {delete_contexts();}

                    db.destroy();
                });				
			} else {res.json({success: false, message: err.code });}
		});
    }
	
    function delete_contexts() {
		var query = "call editor_context_delete(?, @result)";
		db.connect.query(query, deleted, function(err, results, fields){
			if(err) { 
				return;
			}
		});
    }
}
