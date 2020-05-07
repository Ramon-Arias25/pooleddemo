'use sctrict'

 var mongoose = require('mongoose');
 var app = require ('./app');
 var port = 3800;
 
 mongoose.set('useFindAndModify', false);
 mongoose.Promise - global.Promise;
 
 mongoose.connect('mongodb://localhost:27017/pooleddemo', {  
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        console.log('++ DB is Connect');

        //create server
        app.listen(port, () => {
            console.log('++ Server on http://localhost:', port );
        });
    })
    .catch(err => console.log(err));