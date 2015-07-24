config_default = {};
config_default.application_name = 'Plentystars';
config_default['db_client'] = {
    host: 'localhost',
    user: 'root',
    password: '',
    port: 3306,
    db_config: 'a_conf',
    db_cdr: 'a_cdr'
};
config_default.webserver = {
    port: 443,
    ip_allowed: "['0.0.0.0']",
    logio_port: 28778,
    tty_port: 8000
};

module.exports = config_default;