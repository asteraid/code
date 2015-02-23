/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
var fs = require("fs");

exports.sound = function (req, res) {
    
    console.log('upload.sound '+req.files.sound_file.name);
    fs.readFile(req.files.sound_file.path, function (err, data) {
      var newPath = config.soundpath+"/"+req.files.sound_file.name;
      fs.writeFile(newPath, data, function (err) {
	console.log(newPath);
        console.log('writeFile');
        console.log(err);
        if (!err)
            res.json({success: true, filename: req.files.sound_file.name});
        else
            res.json({success: false, err: err});
      });
    });

};


