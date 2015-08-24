var fs = require("fs");

exports.sound = function (req, res) {
  //console.log('upload.sound '+req.files.sound_file.name);
  fs.readFile(req.files.sound_file.path, function (err, data) {
    var newPath = config.soundDir + "/" + req.files.sound_file.name;
    fs.writeFile(newPath, data, function (err) {
      if (!err)
        res.json({success: true, filename: req.files.sound_file.name});
      else
        res.json({success: false, err: err});
    });
  });
};