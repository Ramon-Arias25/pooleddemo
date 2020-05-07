'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Publication = require('../models/publication');
var User = require('../models/user');
var Follow = require('../models/follow');

function prueba(req, res) {
    res.status(200).send({
        message: 'Hola mundo desde el controlador de Publications'
    });
}
function savePublications(req, res) {

    var params = req.body;

    if (!params.text) return res.status(200).send({ message: 'Debes enviar un texto' });

    var publication = new Publication();
    publication.text = params.text;
    publication.file = null;
    publication.user = req.user.sub;
    publication.create_at = moment().unix(); 

    publication.save((err, publicationStored) => {
        if (err) return res.status(500).send({ message: 'Error al guardar la publicacion' });

        if (!Publication) return res.status(404).send({ message: 'La publicacion no se ha guardado' });

        return res.status(200).send({ publication: publicationStored })
    });
}

function getPublications(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 4;
    var follows_clean = [];
    //esto se puede aplicar en el controlador de usuarios Getusers ACTIVO!!
    Follow.find({ "user": req.user.sub }).populate('followed').exec().then((follows) => {
        for (let i in follows) {
            follows_clean.push(follows[i].followed._id);
        }
        follows_clean.push(req.user.sub);
        Publication.find({ user: { $in: follows_clean } }).sort({ create_at: -1 }).populate('user').paginate(page, itemsPerPage, (err, publications, total) => {
            if (err) return res.status(500).send({ message: 'Error devolver publicaciones' });
            if (!publications) return res.status(404).send({ message: 'No existen publicaciones' });
            return res.status(200).send({
                total_items: total,
                pages: Math.ceil(total / itemsPerPage),
                page: page,
                itemsPerPage: itemsPerPage,
                publications
            }
            )
        });
    });
}

function getPublicationsByUser(req, res) {
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }

    if(req.params.id){
        var userId = req.params.id
    }else{
        var userId = req.params.sub
    }

    var itemsPerPage = 4;
    Publication.find({ user: userId }).sort({ create_at: -1 }).populate('user').paginate(page, itemsPerPage, (err, publications, total) => {
        if (err) return res.status(500).send({ message: 'Error devolver publicaciones' });
        if (!publications) return res.status(404).send({ message: 'No existen publicaciones' });
        return res.status(200).send({
            total_items: total,
            pages: Math.ceil(total / itemsPerPage),
            page: page,
            itemsPerPage: itemsPerPage,
            publications
        })
    });
}

function getPublication(req, res) {
    var publicationid = req.params.id;

    Publication.findById(publicationid, (err, publication) => {
        if (err) return res.status(500).send({ message: 'Error devolver publicaciones ' });

        if (!publication) return res.status(404).send({ message: 'No existe publicacion' });

        return res.status(200).send({ publication });
    });
}

//ELIMINAR PUBLICACION
function deletePublication(req, res) {
    var publicationId = req.params.id;

    Publication.find({ 'user': req.user.sub, '_id': publicationId })
        .deleteOne((err, publicationRemoved) => {
            if (err) return res.status(500).send({ message: 'Error al borrar publicaciones' });
            if (!publicationRemoved) return res.status(404).send({ message: 'No se ha borrado la publicacion ' });

            if (publicationRemoved.n == 1) {
                return res.status(200).send({ message: 'Publicacion eliminada correctamente' });
            } else {
                return res.status(404).send({ message: 'Error al borrar publicacion' });
            }

        });

}

//Subir archivos de Imagen de publicacion
function uploadImage(req, res) {
    var publicationId = req.params.id;
    
    if (req.files) {
        var file_path = req.files.file.path;
        var file_split = file_path.split('\\');
        var file_name = file_split[2];
        var ext_split = file_name.split('\.');
        var file_ext = ext_split[1];

        if (file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'git') {

            Publication.find({ 'user': req.user.sub, '_id': publicationId }).exec((err, publication) => {
                if (publication) {
                    //actualizar documento de publicacion
                    Publication.findByIdAndUpdate({ _id: publicationId }, { file: file_name }, { new: true }, (err, publicationUpdate) => {

                        if (err) return res.status(500).send({ message: 'Error en la peticion' });

                        if (!publicationUpdate) return res.status(404).send({ message: 'No se ha podido actualizar el archivo' });

                        return res.status(200).send({ publication: publicationUpdate });
                    });
                }else{
                    fs.unlink(file_path, (err) => {
                        return res.status(200).send({ message: 'No tiene permiso de actualizar publicacion' });
                    });
                }
            });

        }else{
            fs.unlink(file_path, (err) => {
                return res.status(200).send({ message: 'Extension no valida' });
            });
        }

    }else{
        return res.status(200).send({ message: 'No se ha subido archivo' });
    }
}

function getImageFile(req, res) {
    var image_file = req.params.imageFile;
    var path_file = './uploads/publications/' + image_file;

    fs.exists(path_file, (exists) => {
        if (exists) {
            res.sendFile(path.resolve(path_file));
        } else {
            res.status(200).send({ message: 'No existe la imagen. . . ' });
        }
    });
}

module.exports = {
    prueba,
    savePublications,
    getPublications,
    getPublication,
    deletePublication,
    uploadImage,
    getImageFile,
    getPublicationsByUser
}