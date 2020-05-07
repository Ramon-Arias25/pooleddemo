'use strict'
var express = require ('express');
var UserController = require('../controllers/user');

var api = express.Router();
var md_Auth = require('../middlewares/authenticated');

var multiparty = require ('connect-multiparty');
var md_upload = multiparty({uploadDir: './uploads/users'});

api.get('/home', UserController.Home);
api.get('/Pruebas', md_Auth.ensureAuth, UserController.pruebas);
api.post('/register', UserController.saveUser);
api.post('/login', UserController.loginUser);
api.get('/user/:id', md_Auth.ensureAuth, UserController.getUser);
api.get('/users/:page?', md_Auth.ensureAuth, UserController.getUsers);
api.put('/update/user/:id', md_Auth.ensureAuth, UserController.updateUser);
api.post('/upload/user/image/:id', [md_Auth.ensureAuth, md_upload] , UserController.uploadImage);
api.get('/get/user/image/:imageFile', UserController.getImageFile);
api.get('/counters/:id?', md_Auth.ensureAuth, UserController.getCounters); 
 
module.exports = api;