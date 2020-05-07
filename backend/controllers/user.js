'use strict'
var bcrypt = require('bcrypt-nodejs');
var mongoosePaginate = require('mongoose-pagination');
var fs = require('fs');
var path = require('path');

var User = require('../models/user');
var Follow = require('../models/follow');
var Publication = require('../models/publication');
var jwt = require('../services/jwt');
 

function Home(req, res) {
    res.status(200).send({
        message: 'Home'
    });
}

function pruebas(req, res) {
    res.status(200).send({
        message: 'Hola mundo desde el controlador de user'
    });
} 

function saveUser(req, res) {
    var params = req.body;
    var user = new User();
    if (params.name && params.surname &&
        params.nick && params.email &&
        params.password) {

        user.name = params.name;
        user.surname = params.surname;
        user.nick = params.nick;
        user.email = params.email;
        user.role = 'ROLE_USER';
        user.image = null;

        User.find({
            $or: [
                { email: user.email.toLowerCase() },
                { nick: user.nick.toLowerCase() }
            ]
        }).exec((err, users) => {
            if (err) return res.status(500).send({ message: "error en la peticion de usuarios" });

            if (users && users.length >= 1) {
                return res.status(200).send({ message: "el email/nick existe" })
            } else {
                bcrypt.hash(params.password, null, null, (err, hash) => {
                    user.password = hash;

                    user.save((err, userStored) => {
                        if (err) return res.status(500).send({ message: 'error al guardar usuario' });

                        if (userStored) {
                            res.status(200).send({ user: userStored });
                        } else {
                            res.status(404).send({ message: ' no se ha registrado el usuario' });
                        }
                    });
                });
            }
        });



    } else {
        res.status(200).send({
            message: "faltan datos"
        });
    }
}

function loginUser (req,res){
    var params = req.body;
    var email = params.email;
    var password = params.password;
    
    User.findOne({email:email}, (err, user) => {
        if (err) return res.status(500).send({message: 'Error en la peticion'});

        if (user){
            bcrypt.compare(password, user.password, (err, check) => {
                if (check){
                    if (params.gettoken){
                        //generar & devolver token
                        return res.status(200).send({
                            token: jwt.createtoken(user)
                        });
                    }else{
                        //devolver datos de usuario
                        user.password = undefined;
                        return res.status(200).send({user});
                    }
                }else{
                    return res.status(404).send({message: 'el usuario no se ha podido identificar'});
                }
            });
        }else{
            return res.status(404).send({message: 'el usuario no existe'});
        }
    });
}

function getUser (req,res){

    var userId = req.params.id;    
    User.findById(userId, (err, user) => {
        if (err) return res.status(500).send({message: ' Error en la peticion'});

        if (!user) return res.status(404).send({message: 'El usuario no existe'});
        
        followUserIds(userId)
        .then((value) => {
            user.password = undefined;
            return res.status(200).send({
                user,
                following: value.following,
                followers: value.followers
            });
        });

    });
}


async function followThisUser(identity_user_id, user_id){
 /*
    var following = await Follow.findOne({'user':identity_user_id, 'followed': user_id}).exec(follow => {
        //if (err) return handleError(err);
        return follow;
    });
    /*
    Follow().catch(function(e) {
        console.log(e); // "Uh-oh!"
    });*/

    /*var followed = await Follow.findOne({'user':user_id, 'followed': identity_user_id}).exec(follow => {
        //if (err) return handleError(err);
        return follow;
    });*/

    /*followed.catch(function(e) {
        console.log(e); // "Uh-oh!"
    });*/
/*
    return {
        following: following,
        followed: followed
    }*/
    
        var following = await Follow.find({'user': user_id}).select({'_id':0, '__v':0, 'user':0}).exec().then((follows)=>{  
            var follows_clean = [];
            for (let i in follows) {
                follows_clean.push(follows[i].followed._id); 
            } 
            return follows_clean;
        });
        
        var followed = await Follow.find({'followed': user_id}).select({'_id':0, '__v':0, 'followed':0}).exec().then((follows)=>{  
            var follows_clean = [];
            for (let i in follows) {
                follows_clean.push(follows[i].user._id); 
            } 
            return follows_clean;
        });//27032020
        return {
            following: following,
            followed: followed
        }
    
}

function getUsers (req,res){
    var identify_user_id = req.user.sub;
    var page = 1
    if (req.params.page){
        page = req.params.page;
    }
    var itemsPerPage = 5;
    User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total) => {
        if (err) return res.status(500).send({message: ' Error en la peticion'});
        if (!users) return res.status(404).send({message: 'No hay usuarios disponibles'});
        followUserIds(identify_user_id).then((value) => {
            return res.status(200).send({
                users,
                following: value.following,
                followed: value.followers,
                total,
                pages: Math.ceil(total/itemsPerPage)
            });    
        });
    });
}

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

function updateUser (req,res){
    var userId = req.params.id;
    var update = req.body;
    //borrar prorpiedad password
    delete update.password;

    if (userId != req.user.sub){
        return res.status(500).send({message: 'no tiene permiso para actualizar los datos del usuario'});
    }

    User.find({ $or: [
                {email:update.email.toLowerCase()},
                {nick: update.nick.toLowerCase}
            ]}).exec((err, users) => {
               
                var userIsset = false;
                users.forEach((user) => {
                    if (user && user._id != userId) userIsset = true;
                });
                if (userIsset) return res.status(200).send({message: 'los datos ya estan en uso'});
                
                User.findByIdAndUpdate(userId, update, {new:true}, (err,userUpdated) => {
                    if (err) return res.status(500).send({message: 'No se ha podido actualizar el usuario'});

                    if (!userUpdated) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});

                    return res.status(200).send({user:userUpdated});
                });

            });
}

function uploadImage (req,res) {

    var userId = req.params.id;
    //borrar prorpiedad password

    if (userId = req.user.sub){
        if (req.files){
            
            var file_path = req.files.image.path;
            var file_split = file_path.split('\\');
            var file_name = file_split[2];
            var ext_split = file_name.split('\.');
            var file_ext = ext_split[1];

            if (file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif'){
                User.findByIdAndUpdate(userId, {image: file_name}, {new:true},(err,userUpdated) => {
                    console.log(file_name);
                    if (err) return res.status(500).send({message: 'No se ha podido actualizar el usuario'});
    
                    if (!userUpdated) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});
            
                    return res.status(200).send({user:userUpdated});
                });
            }else{
                fs.unlink(file_path, (err)=>{
                    return res.status(200).send({message: 'Extension no valida'});
                });
            }

        } else {
            return res.status(200).send({message: 'No se adjunto imagen'});
        }

    } else {

        fs.unlink(file_path, (err)=>{
            return res.status(500).send({message: 'no tiene permiso para actualizar los datos del usuario'});
        });
    }
}

function getImageFile (req,res){
    var image_file = req.params.imageFile;
    var path_file = './uploads/users/' + image_file;


    fs.exists(path_file, (exists) => {
        if (exists){
            res.sendFile(path.resolve(path_file));
        } else {
            res.status(200).send({message: 'No existe la imagen'});
        }
    });
}
function getCounters(req,res){
    var userId = req.user.sub;
    if(req.params.id){
        userId = req.params.id;
        
    }

    getCountAll(userId).then((value)=>{
        
        return res.status(200).send(value);
        
    });

}
async function getCountAll(user_id) {
    var following = await Follow.countDocuments({ user: user_id })
        .exec()
        .then((count) => {
        //    console.log(count);
            return count;
        })
        .catch((err) => { return handleError(err); });
 
    var followed = await Follow.countDocuments({ followed: user_id })
        .exec()
        .then((count) => {
            return count;
        })
        .catch((err) => { return handleError(err); });
 
    var publication = await Publication.countDocuments({ user: user_id })
        .exec()
        .then((count) => {
            return count;
        })
        .catch((err) => { return handleError(err); });
        
    return { following: following, 
        followed: followed, 
        publication: publication }
}

module.exports = {
    Home,
    pruebas,
    saveUser,
    loginUser,
    getUser,
    getUsers,
    updateUser,
    uploadImage,
    getImageFile,
    getCounters
}