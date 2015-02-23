exports.get_events = function(req, res) {
    var db = new database(req, res);
    if(db.connect){
        
        var separator = ";";
        
        var query = "SELECT c.category, c.item_id, GROUP_CONCAT(c.var_name SEPARATOR '" + separator +"') AS 'keys', GROUP_CONCAT(c.var_val SEPARATOR '" + separator +"') AS 'values' FROM config_items ci JOIN config c ON ci.id=c.item_id WHERE ci.type='conference' GROUP BY c.item_id ORDER BY c.id, c.item_id";
        
        db.connect.query(query, function(err, results, fields) {
            if(!err) {
                if (results.length > 0) {
					
					console.log(results);
             
                    var events = [];
					//records loop
                    for(var i in results){
                        var record = results[i];
                        var keys = record['keys'];
                        var values = record['values'];
                        
                        var keys_arr = keys.split(separator);
                        var values_arr = values.split(separator);
                        
                        var count = keys_arr.length;
                        var event = new Object();
                        
                        for(j = 0; j < count; j++){
                            var key = keys_arr[j];
                            var value = values_arr[j];
                            
                            //if(key == 'next_start')
                                //key = 'start';
                                
                            event[key] = value;
                        }
                        
                        event['id'] = record['item_id'];
                        event['conf_num'] = record['category'];
                        
                        event['start'] = event['start_date'] + 'T' + event['start_time'];
                        event['end'] = event['start_date'] + 'T' + event['end_time'];
                        
                        events.push(event); 
                    }
                    
                    res.json(events);                    
                    
                    db.destroy();
                } else {
                    res.json( {success: false, rows: [], message: 'Not found events'});
                    db.destroy();
                }
            } else res.json({success: false, rows: [], message: err.code });
        });
    }
    else{
        res.json({ success: false, rows: [], message: 'Error sessions'});
    }
};

exports.get_conference_by_id = function(req, res){
	var db = new database(req, res);
	
	if(db.connect){
		
		var conferenceId = req.param('conferenceId');
		if(conferenceId && typeof(conferenceId) != 'undefined'){
			
			var query = "SELECT var_name, var_val FROM config WHERE item_id = " + conferenceId;
			db.connect.query(query, function(err, results, fields){
				
				var conferenceData = new Object();
				for(var i in results){
					conferenceData[results[i]['var_name']] = results[i]['var_val'];
				}
				
				res.json({success: true, data: conferenceData});
				db.destroy();
			});
		}
		else {
			res.json({success: false, message: 'Incorrect conference ID'});
			db.destroy();
		}
	}
	else {
		res.json({ success: false, message: 'Error sessions'});
	}
}

exports.get_conference_numbers = function(req, res) {
    var db = new database(req, res);
    
    var condition = "WHERE type = 'conference'";

    if(typeof(req.param('q_word')) != 'undefined' && req.param('q_word').length){

		var search_name = req.param('q_word')[0];
		var condition = condition + " AND name LIKE '" + search_name +"%'";
		
	}
    if(db.connect){
        
        var query = "SELECT name, id FROM config_items " + condition + " GROUP BY name ORDER BY name ASC";
        
        db.connect.query(query, function(err, results, fields) {
            if(!err) {
				res.json( {cnt_whole: results.length, result: results});
				db.destroy();
            } 
            else {
				res.json({success: false, message: err.code });
				db.destroy();
			}
        });
    }
    else{
        res.json({ success: false, message: 'Error sessions'});
    }
};

exports.save_conference = function(req, res){

	var db = new database(req, res);
	if(db.connect) {
            console.log('connected');
		var title = req.param('title'),
		start_date = req.param('start_date'),
		start_time = req.param('start_time'),
		end_time = req.param('end_time'),
		repeat_every = req.param('repeat_every'),
		ext_list = req.param('ext_list'),
		action = req.param('action'),
		category = req.param('conf_num'),
		id = req.param('id');

		if(id === undefined || id == ''){
			id = 0;
		}
		
		if(action == 'create')
			var message = "Conference Successfuly Created!";
		else
			var message = "Conference Successfuly Updated!";
		
		
		
		var sql = new getSQL({
			id: id,
			itemtype: "conference",
			filename: "confbridge.conf",
			name: category,
			comment: category,
			params: "type;title;start_date;start_time;end_time;repeat_every;ext_list",
			values: 'bridge;' + title + ';' + start_date + ';' + start_time + ';' + end_time + ';' + repeat_every + ';' + ext_list,
			commented: 'yes'
		});
			
		var query = sql.save_item();
        
		db.connect.query(query, function(err, results, fields) {
                    console.log(err);
                    if(!err) {
                        var conference = {title: title, start: start_date + 'T' + start_time, end: start_date + 'T' + end_time};

                        res.json({success: true,  results: results , message: message, conference: conference});
                    } 
                    else 
                        res.json({success: false, message: err.code});
		});            
	} 
	else res.json({ success: false, message: 'Error sessions'});
}


exports.delete_conference = function (req, res) {
    var db = new database(req, res);
    if(db.connect) {
        var id = req.param('conferenceId');

     
        var query = "call delete_item('"+id+"', @result);";
        
        db.connect.query(query, function (err, results, fields) {
			
            if(!err) {
				
                db.connect.query("SELECT @result", function(err, results, fields) {
					
                    var result = results[0]['@result'];
                    if(result) {
                        res.json( {success: true,  results: result , message: "Conference successfuly deleted!" });
                        db.destroy();
                    } else {
                        res.json( {success: false,  results: result, message: "Conference not deleted!" });  
                        db.destroy();
                    }
                });
            } 
            else res.json({success: false, message: err.code });
        });            
   
    } else res.json({ success: false, message: 'Error sesisons'});
};
