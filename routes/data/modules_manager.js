var fs = require('fs'),
	unzip = require('unzip'),
	path = require('path'),
	rmdir = require('rimraf');
	
var baseDir = path.dirname(require.main.filename);//Full path to app directory

exports.get_modules_list = function(req, res){
	var db = new database(req, res);
    if(db.connect) {
		var query = "SELECT * FROM modules ORDER BY name";
		db.connect.query(query, function (err, results, fields) {
			if(!err) {
				if(results.length) {
					res.json( {success: true,  rows: results});
					db.destroy();
				} else {
					res.json( {success: false,  message: "The are no modules installed!" });  
					db.destroy();
				}
			}
			else {
				res.json({success: false, message: err.code });
				db.destroy();
			}
		});
	}
	else 
		res.json({ success: false, message: 'Error sesisons'});
};

exports.install_module = function(req, res){

	var moduleFile = req.files.module_package.path;

	var extractPath = baseDir + '/tmp' ;
	console.log(extractPath);
	
	var package_file_name = req.files.module_package.name;
	console.log("package_file_name", package_file_name);

	var extracted_directory = package_file_name.substr(0, package_file_name.lastIndexOf('.'));
	console.log("extracted_directory", extracted_directory);

	//Extract module archive
	fs.createReadStream(moduleFile)
		.pipe(unzip.Extract({path: extractPath})
		.on('close', function(){
				
				var extractedPath = baseDir + '/tmp/' + extracted_directory
				//read package info file
				fs.readFile(extractedPath + "/module_info.json", 'utf8', function (err, data) {
					console.log(extractedPath);
					if (err) {
						res.json({success: false, message: "Can not read module information file!"})
					}
					 
					var package_info = JSON.parse(data);
					console.log(package_info);
					
					//Extract module files
					var module_files_archive = extractedPath + '/module_files.zip';
					fs.createReadStream(module_files_archive)
						.pipe(unzip.Extract({path: baseDir})
							.on('close', function(){
								
								//read SQL file
								fs.readFile(extractedPath + "/install.sql", 'utf8', function (err, query) {
									if (err) {
										res.json({success: false, message: "Can not read module SQL file!"})
									}
									
									console.log(query);
									var db = new database(req, res);
									if(db.connect) {
										db.connect.query(query, function (err, results, fields) {
											if(!err) {
												res.json({success: true, message: "Module successfuly installed!"});
												db.destroy();
											}
											else {
												res.json({success: false, message: err.code });
												db.destroy();
											}
										});
									}
									else{
										res.json({ success: false, message: 'Error sesisons'});
										
									}
								});
                
                //Clear tmp folder
								/*fs.exists(extractedPath, function(exists){
									if(exists){
										rmdir(extractedPath, function(error){
											if(error){
												console.log("Error while removing directory: " + extractedPath);
											}
										});
									}
								});*/
							})
						);
			 
				});
			})
		);
	//fs.readFile(req.files.module_package.path, function (err, data) {
	 //
	  //console.log(data);
//
	//});

}

exports.uninstall_module = function(req, res){
	var db = new database(req, res);
	
    if(db.connect) {
		var id = req.param('id');
		if(parseInt(id)){
			var query = "SELECT href FROM modules WHERE id = " + id;
			db.connect.query(query, function (err, results, fields) {
				if(!err) {
					if(results.length) {
						var href = results[0]['href'];
						
						var module_name = href.toLowerCase().substring(1, href.length);
						
						//remove router
						var router = baseDir + '/routes/data/' + module_name + ".js";
						fs.exists(router, function(exists){
							if(exists){
								fs.unlink(router);
							}
							else {
								console.log('Can not find file to remove: ' + router);
							}
						});
						
						
						//remove main view
						var main_view = baseDir + '/views/' + module_name + ".jade";
						fs.exists(main_view, function(exists){
							if(exists){
								fs.unlink(main_view);
							}
							else {
								console.log('Can not find file to remove: ' + main_view);
							}
							
						});
						
						//remove layout view
						var layout_view = baseDir + '/views/layouts/' + module_name + ".jade";
						
						fs.exists(layout_view, function(exists){
							if(exists){
								fs.unlink(layout_view);
							}
							else {
								console.log('Can not find file to remove: ' + layout_view);
							}
							
						});
						
						//remove modal windows views
						var modal_directory= baseDir + '/views/modal/' + module_name;
						fs.exists(modal_directory, function(exists){
							if(exists){
								rmdir(modal_directory, function(error){
									if(error){
										console.log("Error while removing directory: " + modal_directory);
									}
								});
							}
							else {
								console.log('Can not find directory to remove: ' + modal_directory);
							}
							
						});
						
						
						
						//remove from modules table
						var query = "DELETE FROM modules WHERE id = " + id;
						db.connect.query(query, function (err, results, fields) {
							if(!err) {
								//remove from user_settings table
								var query = "DELETE FROM user_settings WHERE module_id = " + id;
								db.connect.query(query, function (err, results, fields) {
									if(!err) {
										res.json({success: true, message: "Module successfuly uninstalled."});
										db.destroy();
									}
									else {
										res.json({success: false, message: err.code });
										db.destroy();
									}
								});
							}
							else{
								res.json({success: false, message: err.code });
								db.destroy();
							}
						})
						

					} else {
						res.json( {success: false,  message: "The are no installed modules!" });  
						db.destroy();
					}
				}
				else {
					res.json({success: false, message: err.code });
					db.destroy();
				}
			});
		}
		else {
			res.json({success: false, message: "Specify module id please."});
		}
	}
	else {
		res.json({ success: false, message: 'Error sesisons'});
	}
}
