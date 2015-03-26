exports.get_itemid = function (req, res) {
    var db = new database(req, res);
    if(db.connect) {
        var item_name = req.param('item_name');    
        var query = "SELECT GROUP_CONCAT(`item_id` SEPARATOR ',') `item_id` FROM `vItemsConf`, `node` WHERE `name` = 'trunk_name' AND `value` = '" + item_name + "' AND `commented` = 1 GROUP BY `name`";
        db.connect.query(query, function(err, results, fields) {
            if(!err) {
                if(results.length>0)
                    res.json({success: true, rows: results, results: results.length});
                else
                    res.json({success: true, rows: [], message: 'Not found!'});
            } else res.json({success: false, rows: [], message: err.code });
            db.destroy();
        });
   } else res.json({ success: false, rows: [], message: 'Error sessions'});
};

exports.save_trunk = function (req, res) {
    var db = new database(req, res);
    if(db.connect) {
        var name = req.param('name'),
            comment = req.param('comment'),
            id = req.param('id'),
            params = req.param('params'),
            values = req.param('values'),
            node = req.param('node'),
            custom_type = req.param('custom_type'),
            commented = req.param('commented'),
            action = req.param('action');

        var filename = 'sip.conf';

        switch(custom_type) {
            case 'OOH323':
                filename = 'ooh323.conf';
            break;
            case 'IAX2':
                filename = 'iax.conf';
            break;
        }

        if(!name) {
           res.json({success: false, message: "\"Name\" is empty. Please enter the \"Name\"" });
           db.destroy();
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

            var query = sql.save_item();
            console.log(query);

            db.connect.query(query, function(err, results, fields) {
                if(!err){
                    db.connect.query("SELECT @result, @id_trunk", function (err, results, fields) {
                        var result = results[0]['@result'];
                        var id_trunk = results[0]['@id_trunk'];
                        if(result) {res.json( {success: true,  results: result , id_trunk: id_trunk, message: "Trunk "+name+" saved!" });}
                        else
                            res.json( {success: false,  results: result, message: "Trunk not saved!" });
                        db.destroy();
                    });

                } else {
                    res.json({success: false, message: err.code });
                    db.destroy();
                }
            });             
        // end create_trunk
        }
   
        if(action == 'create' || action == 'copy'){
            // проверяем есть ли такой транк у клиента
            var query = "SELECT `name` FROM `vItems` WHERE `type` = 'trunk' AND `name` = '" + name + "'";
            db.connect.query(query,function (err, results, fields) {
                if(!err) {
                    if(results.length == 0) {save_trunk();}
                    else {
                        res.json({success: false, message: "Trunk "+name+" exists!!!" });
                        db.destroy();
                    }
                } else {
                    res.json({success: false, message: err.code });
                    db.destroy();
                }
            });
        } else{save_trunk();}
   } else res.json({ success: false, message: 'Error sessions'});
};

exports.load_trunk = function (req, res) {
    var db = new database(req, res);
	if(db.connect) {
		var id = req.param('id'),
			action = req.param('action');
		var query = "SELECT `name`, `expert`, `commented`, GROUP_CONCAT(`value` SEPARATOR ',') `value`, `node` FROM `vItemsConf` WHERE `item_id` = " + id + " GROUP BY `name`";
		db.connect.query(query, function (err, results, fields) {
			if(!err) {
				if (results.length>0) {
					var jsonObject = [];
					results.forEach(function(item) {
						if(!jsonObject[0]) {
							jsonObject.push({name: 'commented', value: item.commented == 0 ? 'no' : 'yes', expert: 0});
						}
						
						var temp = {};
						temp['name'] = item.name;
						temp['value'] = item.value;
						temp['expert'] = item.expert;
						jsonObject.push(temp);
					});
					res.json( { success: true, data: jsonObject });
				} else res.json( {success: false, message: 'Not found trunks'});
			} else res.json({success: false, message: err.code });
			db.destroy();
		});
   } else res.json({ success: false, message: 'Error sesisons'});
};

exports.delete_trunk = function (req, res) {
    var db = new database(req, res);
	if(db.connect) {
	
		var id = req.param('id'),
			name = req.param('name');
			
		var del_trunk = function(){
		   // delete trunk
			var query = "call delete_item('"+id+"', @result);";
					db.connect.query(query, function (err, results, fields) {
						if (!err) {
							db.connect.query("SELECT @result", function (err, results, fields) {
								var result = results[0]['@result'];
								if( result ) {
								  res.json( {success: true,  results: result , message: "Trunk "+name+" deleted!" });  
								}
								else
								  res.json( {success: false,  results: result, message: "Trunk not deleted!" });  

								db.destroy();
							});
						} else {
						   res.json({success: false, message: err.code });
						   db.destroy();
						}
					});         
				 // -- end delete trunk
	   }

		del_trunk();
   } else res.json({ success: false, message: 'Error sesisons'});
};
