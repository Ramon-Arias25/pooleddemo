'use strict'

var express = require('express');
var publicationsController = require('../controllers/publication');
var api = express.Router();
var md_auth = require('../middlewares/authenticated');

var multipart = require('connect-multiparty');
var md_upload = multipart({ uploadDir: './uploads/publications'});

api.get('/pruebas/publi', md_auth.ensureAuth , publicationsController.prueba);
api.post('/publication', md_auth.ensureAuth, publicationsController.savePublications);
api.get('/publications/:page?', md_auth.ensureAuth, publicationsController.getPublications);
api.get('/publications/:id?/:page?', md_auth.ensureAuth, publicationsController.getPublicationsByUser);
api.get('/publication/:id', md_auth.ensureAuth, publicationsController.getPublication);
api.delete('/publication/:id', md_auth.ensureAuth, publicationsController.deletePublication);
api.post('/publication/update/:id', [md_auth.ensureAuth, md_upload], publicationsController.uploadImage);
api.get('/publication/get/:imageFile', publicationsController.getImageFile);

module.exports = api;