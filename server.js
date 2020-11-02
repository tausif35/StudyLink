const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.urlencoded({extended:true}));
const mongoose=require("mongoose");
const session = require('express-session');
const passport=require("passport")
const passportLocalMongoose=require("passport-local-mongoose");
app.set("view engine","ejs");
mongoose.connect("mongodb+srv://pervyshrimp:123@peoplecluster.ydugl.mongodb.net/User",{ useNewUrlParser: true, useUnifiedTopology: true  })
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("connected")
});

app.listen("3000",function(err){
    if(err){
        console.log(err)
    }else{
        console.log("server started")
    }
})