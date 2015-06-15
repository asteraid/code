exports.item = function(req, res) {
  var path    = require('path');
  var appDir  = path.dirname(require.main.filename);
  var file    = appDir + req.param('file');

  if (require.cache[file]) {
    delete require.cache[file]
    res.json({success: true});
  } else
    res.json({success: false, file:file});
}