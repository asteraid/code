var fs    = require('fs');
var unzip = require('unzip');
var path  = require('path');
var rmdir = require('rimraf');
var db    = require('../../modules/db');
	
var baseDir = path.dirname(require.main.filename);//Full path to app directory

exports.get_modules_list = function(req, res){
  var query = "SELECT * FROM modules ORDER BY name";

  db.query(req, query, function(error, results) {
    if (error) {
      res.json({success: false, message: error.code });
      return;
    }
    
    if (results.length)
      res.json({success: true, rows: results});
    else
      res.json({success: false, message: "The are no modules installed!"});
  });
};

/*exports.remove_module = function(req, res) {
  var paths   = [];
  var query   = [];
  var m       = req.param('module');
  
  if (m === 'module_phonebook') {
    paths = [
      '/views/module_phonebook.jade',
      '/views/module_phonebook_list.jade',
      '/views/m_phonebook/',
      '/views/layouts/m_phonebook.jade',
      '/routes/data/module_phonebook.js',
      '/public/js/custom/m_phonebook/'
    ];
    
    query = [
      'DROP TABLE IF EXISTS m_phonebook_columns',
      'DROP TABLE IF EXISTS m_phonebook_items',
      'DROP TABLE IF EXISTS m_phonebook_values',
      'DELETE m.*, us.* FROM modules m LEFT JOIN user_settings us ON (m.id = us.module_id) WHERE href = "/module_phonebook"'
    ].join(';');
  }
  
  if (m === 'module_conference') {
    paths = [
      '/views/conference.jade',
      '/views/layouts/conference.jade',
      '/views/modal/conference/',
      '/routes/data/conference.js'
    ];
    
    query = [
      'DELETE m.*, us.* FROM modules m LEFT JOIN user_settings us ON (m.id = us.module_id) WHERE href = "/conference"'
    ].join(';');
  }
  
  if (m === 'module_provisioning') {
    paths = [
      '/views/modal/extension/tabs/content/2.jade',
      '/views/modal/extension/tabs/nav/2.jade',
      '/routes/data/module_provisioning.js'
    ];
    
    query = [
      'DROP TABLE IF EXISTS `m_provisioning_files`',
      'DROP TABLE IF EXISTS `m_provisioning_models`',
      'DELETE m.*, us.* FROM modules m LEFT JOIN user_settings us ON (m.id = us.module_id) WHERE m.name = "Provisioning"'
    ].join(';');
  }
  
  console.log(paths, query);
  
  if (paths.length && query.length) {
    paths.forEach(function(path) {
      rmdir(baseDir + path, function(error) {
        if (error)
          console.log("Error while removing directory: " + baseDir + path);
        else
          console.log("Remove complete: " + baseDir + path);
      });
    });
    
    db.query(db.getConfig(null, true), query, function(error, results) {
      if (error)
        console.log(error);
      else
        console.log('Data from database remove completed');
    });
  } else {console.log('Not deleted');}
  
  res.json({message: "See console node.js )"});

}*/

exports.install_module = function(req, res) {
	var moduleFile          = req.files.module_package.path;
	var extractPath         = baseDir + '/tmp';
	var packageFileName     = req.files.module_package.name;
	var extractedDirectory  = packageFileName.substr(0, packageFileName.lastIndexOf('.'));
  var extractedPath       = '';
//  var tmpDirecroty = '/tmp';

	//Extract module archive
	fs.createReadStream(moduleFile)
    .pipe(unzip.Extract({path: extractPath}).on('close', OnCloseExtractModule));
    
  function OnCloseExtractModule() {
    //extractedPath = baseDir + '/tmp/' + extractedDirectory + '/' + extractedDirectory;
    extractedPath = baseDir + '/tmp/' + extractedDirectory;
    //read package info file
    fs.readFile(extractedPath + '/module_info.json', 'utf8', function(error, data) {
      if (error) {
        res.json({success: false, message: "Can not read module information file!"});
        return ;
      }
      //var packageInfo = JSON.parse(data);

      //Extract module files
      var moduleFilesArchive = extractedPath + '/module_files.zip';
      
      fs.createReadStream(moduleFilesArchive)
        .pipe(unzip.Extract({path: baseDir}).on('close', OnCloseExtractModuleFiles));
    });
  }
  
  function OnCloseExtractModuleFiles() {
    //read SQL file
    fs.readFile(extractedPath + '/install.sql', 'utf8', function(error, query) {
      if (error) {
        res.json({success: false, message: "Can not read module SQL file!"});
        return ;
      }
      
      db.query(req, query, function(error, results) {
        if (error) {
          res.json({success: false, message: error.code });
          return ;
        }
        
        //Clear tmp folder
        fs.exists(extractedPath, function(exists) {
          if (exists) {
            rmdir(extractedPath, function(error){
              if (error)
                console.log("Error while removing directory: " + extractedPath);
            });
          }
        });
        
        res.json({success: true, message: "Module successfuly installed!"});
      });
    });
  }
}

exports.uninstall_module = function(req, res) {
  //TODO: completing...
  res.json({success: true, message: "Module successfuly uninstalled."});
}

/*exports.uninstall_module = function(req, res){
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
}*/
