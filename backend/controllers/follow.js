'use strict'

var path = require ('path');
var fs = require ('fs');
var mongoosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follow');

function pruebas(req,res){
    res.status(200).send({message: 'Hola mundo desde el controlador de follows'})
} 

function saveFollows (req,res) {
    
   // var params = req.body;
    var follow = new Follow();
    follow.user = req.user.sub;
    follow.followed = req.params.follow;
    
    follow.save((err, followStored) => {
        if (err) return res.status(500).send({message: 'Error al guardar el seguimiento'});

        if (!followStored) return res.status(404).send({message:'El seguimiento no se ha guardado'});

        return res.status(200).send({follow:followStored});
    });
}

function deleteFollows (req,res){
    var userId = req.user.sub;
    var followId = req.params.id;

    Follow.find({'user': userId, 'followed':followId}).deleteOne(err => {
        if (err) return res.status(500).send({message: 'Error al dejar de seguir'});

        return res.status(200).send({message: 'El follow se ha eliminado!'});
    });
}

function getFollowingUsers (req,res){
    
    var userId = req.user.sub;

    if(req.params.id && req.params.page){
        userId = req.params.id;
    }

    var page = 1;

    if(req.params.page){
        page = req.params.page;
    } else{
        page = req.params.id; //si solo hay un parametro toma el primer parametro (id) como el page
    }

    var itemsPerPage = 4;

    Follow.find({user:userId}).populate({path: 'followed'}).paginate(page,itemsPerPage, (err, follows, total) => {
        
        if (err) return res.status(500).send({message: 'Error en el servidor'});

        if (!follows) return res.status(404).send({message: 'No hay Follows'});
        followUserIds(userId).then((value) => {

            return res.status(200).send({
                total: total,
                pages: Math.ceil(total/itemsPerPage),
                follows,
                following: value.following,
                follower: value.followers,
            });
        });
    });
}

function getFollowedUsers (req,res){
    
    var userId = req.user.sub;

    if(req.params.id && req.params.page){
        userId = req.params.id;
    }

    var page = 1;

    if(req.params.page){
        page = req.params.page;
    } else{
        page = req.params.id; //si solo hay un parametro toma el primer parametro (id) como el page
    }

    var itemsPerPage = 4;
  //Follow.find({user:userId}).populate({path:'followed'}).paginate(page,itemsPerPage, (err, follows, total) => {
    Follow.find({followed:userId}).populate({path:'user'}).paginate(page,itemsPerPage, (err, follows, total) => {
        
        if (err) return res.status(500).send({message: 'Error en el servidor'});

        if (!follows) return res.status(404).send({message: 'No hay Follower'});

        followUserIds(userId).then((value) => {
            
            return res.status(200).send({
                total: total,
                pages: Math.ceil(total/itemsPerPage),
                follows,
                following: value.following,
                follower: value.followers,
            });
        });
    });
}
//Deevolver los usuarios que sigo
function getMyFollows (req,res){
    var userId = req.user.sub;

    var find = Follow.find({user:userId});

    if(req.params.followed){
        find = Follow.find({followed: userId});
    }

    find.populate('user followed').exec((err, follows) => {
        if (err) return res.status(500).send({message: 'Error en el servidor'});

        if(!follows) return res.status(404).send({message: 'No sigues ningun usuario'});

        return res.status(200).send({follows});
    });

}
/* SACAR ESTE METODO APARTE ES COMUN PARA USER Y FOLLOW */
async function followUserIds (user_id){
    
    var following = await Follow.find({'user': user_id}).select({'_id':0, '__v':0, 'user':0}).exec().then((follows)=>{  
        var follows_clean = [];
        for (let i in follows) {
            follows_clean.push(follows[i].followed._id); 
        } 
        return follows_clean;
    });
    
    var followers = await Follow.find({'followed': user_id}).select({'_id':0, '__v':0, 'followed':0}).exec().then((follows)=>{  
        var follows_clean = [];
        for (let i in follows) {
            follows_clean.push(follows[i].user._id); 
        } 
        return follows_clean;
    });//27032020
    return {
        following: following,
        followers: followers
    }
}
module.exports = {
    pruebas,
    saveFollows,
    deleteFollows,
    getFollowingUsers,
    getFollowedUsers,
    getMyFollows
}