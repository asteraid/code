config = {};
config.application_name = 'Plentystars';
config.db = {};
config.db.user = 'root';
config.db.password = '';
config.db.database = '';
config.db.host = 'localhost';
config.db.port = 3306;
config.db.version = '0.2.01234';
config.cdr = {};
config.cdr.database = 'a_cdr';
config.cdr.version = '1.0.0';
config.webserver = {};
config.webserver.port = 443;
config.webserver.ip_allowed = ['0.0.0.0'];
module.exports = config;