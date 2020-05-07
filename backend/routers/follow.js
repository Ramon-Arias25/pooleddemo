'use strict'

var express = require('express');
var FollowController = require('../controllers/follow');
var api = express.Router();
var md_auth = require('../middlewares/authenticated'); 

api.get('/pruebas/follows', md_auth.ensureAuth , FollowController.pruebas );
api.post('/follow/:follow', md_auth.ensureAuth , FollowController.saveFollows );
api.delete('/follows/:id', md_auth.ensureAuth, FollowController.deleteFollows);
api.get('/following/:id?/:page?', md_auth.ensureAuth, FollowController.getFollowingUsers);
api.get('/followed/:id?/:page?', md_auth.ensureAuth, FollowController.getFollowedUsers);
api.get('/getfollows/:followed', md_auth.ensureAuth, FollowController.getMyFollows);

module.exports = api;