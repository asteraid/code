var main = require('./editor_main');

Object.keys(main).forEach(function(item) {
  exports[item] = main[item];
});

exports.get_config = function(req, res) {
	var db = new database(req, res);
    if(db.connect) {
		var config_name = req.param('config_name');

		if(config_name == 'extensions.conf' || config_name == 'extensions-custom.conf')
		    var query = "SELECT * FROM vExtensionsConfAll WHERE editortabname='" + config_name + "' ORDER BY node, cat_metric, var_metric";
		else if(config_name == 'sip.conf' || config_name == 'sip-custom.conf')
		    var query = "SELECT * FROM vSipConfAll WHERE editortabname='" + config_name + "' ORDER BY node, cat_metric, var_metric";
		else
		    var query = "SELECT * FROM vConfigAll WHERE editortabname='" + config_name + "' ORDER BY node, cat_metric, var_metric";

		db.connect.query(query, function (err, results, fields) {
            var editor              = {};
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

                        if(editor[row['node']] === undefined) editor[row['node']] = '';
                        editor[row['node']] += category + row['var_name'] + key_val_separator + row['var_val'] + '\n';
            		});

					res.json({ success: true, config_name: config_name, contexts_id: contexts_id, content: editor});
					db.destroy();
				} else {
					res.json({ success: true, config_name: config_name, contexts_id: contexts_id, content: editor});
					db.destroy();
				}
                //console.log('>>>>>>>', editor_test , '<<<<<<<');
        } else res.json({ success: false, message: 'db error', 'err': err, query: query });
    });
	}
}