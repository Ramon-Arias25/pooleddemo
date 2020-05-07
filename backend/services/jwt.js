'user strict'

var jwt = require('jwt-simple');
var moment = require ('moment');
var secret = 'la_clave_secreta_de_pooleddemo';
exports.createtoken = function (user) {
    var payload = {
        sub: user._id,
        name: user.name,
        surname: user.surname,
        nick: user.nick,
        email: user.email,
        role: user.image,
        iat: moment().unix(),
        exp: moment().add(30, 'days').unix()
    };

    return jwt.encode(payload, secret);

};