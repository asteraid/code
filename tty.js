var tty = require('tty.js');
var config = require('./config.js');

var users = {};
users[config.db.user] = config.db.password;

var app = tty.createServer({
  shell: 'bash',
  hostname: '192.168.56.56',
  //static: __dirname + '/node_modules/tty.js/static_user',
  limitPerUser: 3,
  users: users,
  debug: true,
  https: {
    key: "./cert/ccc-key.pem",
    cert: "./cert/ccc-cert.pem"
  },
  port: config.webserver.tty_port
});

app.listen();