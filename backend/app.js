'use strict'

var express = require('express');
var bodyparser = require ('body-parser');
var morgan = require('morgan');
var cors = require('cors');

var app = express();

//load routes
var user_routers = require('./routers/user');
var follow_routers = require('./routers/follow');
var publi_routers = require('./routers/publication');
var message_routers = require('./routers/message');
//middlewares
app.use(morgan('dev'));
app.use(bodyparser.urlencoded({extended:false}));
app.use(bodyparser.json());
//cors
app.use(cors());
//app.use(express.json());
// Configurar cabeceras y cors
/*app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});*/
//routes
app.use('/api', user_routers);
app.use('/api', follow_routers);
app.use('/api', publi_routers);
app.use('/api', message_routers);
//export
module.exports = app;