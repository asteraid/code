var fs    = require('fs');
var unzip = require('unzip');
var path  = require('path');
var rmdir = require('rimraf');
var db    = require('../../modules/db');
var exec = require('child_process').exec;
  
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

exports.install_module = function(req, res) {
  var moduleFile          = req.files.module_package.path;
  var extractPath         = baseDir + '/tmp';
  var packageFileName     = req.files.module_package.name;
  var extractedDirectory  = packageFileName.substr(0, packageFileName.lastIndexOf('.'));
  var extractedPath       = '';
  var paths   = [];
  var packageInfo;

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

      packageInfo = JSON.parse(data);
      
      var query = "SELECT * FROM modules WHERE name = ?;";
      
      db.query(req, query, [packageInfo.name], function(error, results) {
        if (error) {
          res.json({success: false, message: error.code });
          return ;
        }
        if (results.length) {
          res.json({success: false, message: "This Module already exists!"});
          return ;
        } 
        
      //Extract module files
          
          var moduleFilesArchive = extractedPath + '/module_files.zip';
      
          var streamUnzip = fs.createReadStream(moduleFilesArchive);
          
          streamUnzip
            .pipe(unzip.Parse())
            .on('entry', function (entry) {
                  var fileName = entry.path;
                  var type = entry.type;            
                  if (type==='File')
                    paths.push(fileName);
                  entry.autodrain();
                });
                
          streamUnzip           
            .pipe(unzip.Extract({path: baseDir}).on('close', OnCloseExtractModuleFiles)); 
      });
    });
  }
  
  function execSh(shScript, callback) {

    fs.exists(shScript, function (exists) {
      if (exists) {
        exec(shScript, function (error) {
          if (error) {
            callback(error);
          } else {
            callback(null);
          }
        });
      } else {
        callback(new Error('Bash script not found!'));
      }
    });
  }
  
  function OnCloseExtractModuleFiles() {

    var shScript = extractedPath + '/' + 'install.sh';

    execSh(shScript, function (err) {

      if (err) {
        console.error('exec error: ', err);
      }

      //read SQL file
      
      fs.readFile(extractedPath + '/install.sql', 'utf8', function(error, query) {
        if (error) {
          res.json({success: false, message: "Can not read module SQL file!"});
          return ;
        }

        query += ['CREATE TABLE IF NOT EXISTS `modules_uninstall`',
                  '(`id` int(11) NOT NULL AUTO_INCREMENT,',
                  '`name` varchar(255) NOT NULL,',
                  '`sql` text NOT NULL,',
                  '`sh` text NOT NULL,',
                  'PRIMARY KEY (`id`))',
                  'ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;'].join(' ');

        db.query(req, query, function(error, results) {
          if (error) {
            res.json({success: false, message: error.code });
            return ;
          }

          var sqlUninst = "DELETE FROM modules_uninstall WHERE name = '" + packageInfo.name + "';";
          var shUninst = "rm -f " + paths.join(" ");
      
          fs.readFile(extractedPath + '/uninstall.sql', 'utf8', function(error, data) {
            if (error) {
              console.log("Can not read module SQL file!");
            } else sqlUninst = data + sqlUninst;

            fs.readFile(extractedPath + '/uninstall.sh', 'utf8', function(error, data) {
              if (error) {
                console.log("Can not read module Shell file!");        
              } else shUninst = data;           
         
              query = ['INSERT INTO `modules_uninstall`',
                      '(`name`, `sql`, `sh`)',
                      'VALUES (?, ?, ?);'].join(" "); 

              db.query(req, query, [packageInfo.name, sqlUninst, shUninst], function(error, results) {
                if (error) {
                  res.json({success: false, message: error.code });
                  return ;
                }
                
                res.json({success: true, message: "Module successfuly installed!"});
              });             
            });

            fs.exists(extractedPath, function(exists) {
              if (exists) {
                rmdir(extractedPath, function(err){
                  if (err)
                    console.log("Error while removing directory: " + extractedPath);
                });
              }
            });
          });
        });      
      });
    });
  }
};

exports.uninstall_module = function(req, res) {

  var id = req.param('id');
 
  var query = "SELECT name FROM modules WHERE id = ?;";
 
  db.query(req, query, [id], function(error, results) {
    if (error) {
      console.log(error.code);
      res.json({success: false, message: error.code });
      return ;
    }
    if (!results.length) {
      console.log("Module is broken!");
      res.json({success: false, message: "Module is broken!"});
      return ;
    }

    var nameModule = results[0]['name'];

    query = "DELETE FROM modules WHERE name = ?;";
      
    db.query(req, query, [nameModule], function(error, results) {
      if (error) {
        console.log(error.code);
        res.json({success: false, message: error.code });
        return ;
      }

      query = "SELECT * FROM modules_uninstall WHERE name = ?;";

      db.query(req, query, [nameModule], function(error, results) {
        if (error) {
          console.log(error.code);
        }
        if (!results.length) {
          console.log("Uninstall not found!");          
        } else {
          query = results[0]['sql'];

          query && db.query(req, query, function(error, results) {
                      if (error) {
                        console.log(error.code);              
                      }        
                   });

              var sh = exec(results[0]['sh'], function (error) {        
                if (error) {
                  console.log('exec error: ' + error);              
                }       
              });              
          }             
      });
    });
  });

  res.json({success: true, message: "Module successfuly uninstalled"});
};