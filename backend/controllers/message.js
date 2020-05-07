'use strict'

var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Follows = require('../models/follow');
var Message = require('../models/message');

function prueba (req,res) {
    res.status(200).send({nessage: 'Hola mundo desde el controlador de Message'});
}

function saveMessage (req,res) {
    var params = req.body;

    if(!params.text || !params.receiver) {
        return res.status(200).send({nessage: 'Envia los datos necesarios'});
    }

    var message = new Message();
    message.emitter = req.user.sub;
    message.receiver = params.receiver;
    message.text = params.text;
    message.create_at = moment().unix();
    message.viewed = 'false';

    message.save((err, messageStored) => {
        if(err) return res.status(500).send({nessage: 'Error en la petición'});

        if(!messageStored) return res.status(500).send({nessage: 'Error en la petición'});

        return res.status(200).send({message: messageStored});
    });

}
// get mensajes recibidos
function getReceivedMessages(req,res){
    var userId = req.user.sub;

    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }

    var itemsPerPage = 4;

    Message.find({receiver: userId}).populate({ 
        path: 'emitter',
        select: '_id image nick surname name'
    }).sort('-create_at').paginate(page, itemsPerPage, (err, messages, total) => {
        
        if(err) return res.status(500).send({message: 'Error en la petición'});

        if(!messages) return res.status(404).send({message: 'No hay mensajes que mostrar'});
        
        return res.status(200).send({
            total: total,
            pages: Math.ceil(total/itemsPerPage),
            messages
        });
    });
}
// get mensajes enviados
function getEmitterMessages(req,res){
    var userId = req.user.sub;

    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }

    var itemsPerPage = 4;

    Message.find({emitter: userId}).populate({ 
        path: 'receiver',
        select: '_id image nick surname name'
    }).sort('-create_at').paginate(page, itemsPerPage, (err, messages, total) => {
        
        if(err) return res.status(500).send({message: 'Error en la petición'});

        if(!messages) return res.status(404).send({message: 'No hay mensajes que mostrar'});
        
        return res.status(200).send({
            total: total,
            pages: Math.ceil(total/itemsPerPage),
            messages
        });
    });
}

function getUnViewedMessages(req,res){
    var userId = req.user.sub;

    Message.countDocuments({receiver:userId, viewed:'false'}).exec((err, count) =>{
        if(err) return res.status(500).send({message: 'Error en la petición'});
        //console.log(count);
        return res.status(200).send({
            'unviewed': count
        });
    });
}

function setViewedMessages(req,res){
    var userId = req.user.sub;

    Message.update({receiver:userId, viewed:'false'},{viewed: 'true'}, {'multi':true}, (err, messagesUpdated) =>{
        if(err) return res.status(500).send({message: 'Error en la petición'});

        return res.status(200).send({
            messages: messagesUpdated
        });
    });
}

module.exports = {
    prueba,
    saveMessage,
    getReceivedMessages,
    getEmitterMessages,
    getUnViewedMessages,
    setViewedMessages
}