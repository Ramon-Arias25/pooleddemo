'use strict'

var express = require('express');
var MessageController = require('../controllers/message');
var api = express.Router();
var md_auth = require('../middlewares/authenticated');

api.get('/pruebas/message', md_auth.ensureAuth , MessageController.prueba );
api.post('/send-message', md_auth.ensureAuth , MessageController.saveMessage);
api.get('/inbox-messages/:page?', md_auth.ensureAuth , MessageController.getReceivedMessages);
api.get('/outbox-messages/:page?', md_auth.ensureAuth , MessageController.getEmitterMessages);
api.get('/msgunviewed' , md_auth.ensureAuth, MessageController.getUnViewedMessages);
api.get('/msgsetviewed' , md_auth.ensureAuth , MessageController.setViewedMessages);

module.exports = api;