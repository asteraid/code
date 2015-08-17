
exports.index = function (req, res) {

    var fs = require('fs'),
        path = require('path'),
        baseDir = path.dirname(require.main.filename),
        modules = [];

    fs.readdirSync(path.join(baseDir, '/routes/api')).forEach(function(file) {
        var fileNameParts = file.split('.');
        if (fileNameParts[0] === 'index')
            return;
        modules.push({module: fileNameParts[0]});
    });

    res.json({modules: modules});

};
