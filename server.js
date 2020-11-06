require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate =require("mongoose-findorcreate");
const multer  = require('multer')
const path = require('path');
const app = express();
app.use(bodyParser.urlencoded({extended:true}))
const mongoose=require("mongoose");
const validator = require('validator');
const session = require('express-session');
const passport=require("passport")
const nodemailer = require("nodemailer");
const generator = require('generate-password');
const passportLocalMongoose=require("passport-local-mongoose");
app.set("view engine","ejs");
app.use(express.static("public"))
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/');
    },

    // By default, multer removes file extensions so let's add them back
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
  
const upload = multer({ storage: storage });
app.use(session({
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized: true,
    cookie : {
        maxAge: 1000* 60 * 60 *24 * 365
    }
}))
app.use(passport.initialize())
app.use(passport.session())
mongoose.connect("mongodb+srv://pervyshrimp:123@peoplecluster.ydugl.mongodb.net/User",{ useNewUrlParser: true, useUnifiedTopology: true  })
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("connected")
});


const userSchema=new mongoose.Schema({
    username:String,
    email:String,
    password:String,
    fullname:String,
    type:String,
    googleId:String,
    facebookId:String
})

// const questionSchema=new mongoose.Schema({
//     questions:[],
// })

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User=new mongoose.model("User",userSchema)
// const Question=new mongoose.model("Question",questionSchema)
passport.use(User.createStrategy());


passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID:     process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL :"http://www.googleapis.com/oauth2/v3/userInfo"
  },
  function(request, accessToken, refreshToken, profile, done) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return done(err, user);
    });
  }
));
passport.use(new FacebookStrategy({
    clientID: process.env.CLIENT_ID_FACEBOOK,
    clientSecret: process.env.CLIENT_SECRET_FACEBOOK,
    callbackURL: "http://localhost:3000/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));













app.get('/auth/google',
  passport.authenticate('google', { scope:
      [ 'email', 'profile' ] }
));

app.get( '/auth/google/secrets',
    passport.authenticate( 'google', {
        successRedirect: '/information',
        failureRedirect: '/login'
}));
app.get('/auth/facebook',
  passport.authenticate('facebook'));

  app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/home');
  });
  app.get("/",function(req,res){
    if(req.isAuthenticated()){
        res.redirect("/home")
    }else{
        res.redirect("/login")
    }
})

app.get("/information",function(req,res){
    if(req.isAuthenticated()){
        if(!req.user.type){
            res.render("test")
        }else{
            res.redirect("/home")
        }
    }    
})
app.get("/login",function(req,res){
    res.render("login")
})
app.get("/signup",function(req,res){
    res.render("signup")
})
app.get("/home",function(req,res){
    if(req.isAuthenticated()){
        res.render("home")
    }else{
        res.redirect("/login")
    }
})
app.get("/forgot",function(req,res){
    res.render("forgot")
})
// app.get("/question/:topic",function(req,res){
//     if(req.isAuthenticated() && req.user.type==="teacher"){
//         const id=req.params.topic;
//         Question.findById(id, function (err, qs) {
//             if(!qs){
//                 res.send("wrong link.try again")
//             }else{
//                 res.render("createQs",{topic:id})
//             }
//         })
//     }else{
//         if(req.user.type!=="teacher"){
//             res.send("tui hala chatro")
//         }else{
//             res.redirect("signup")
//         }
//     }
// })
// app.get("/questionpaper/:topic",function(req,res){
//     if(req.isAuthenticated()){
//         const id=req.params.topic;
//         Question.findById(id, function (err, qs) {
//             if(!qs){
//                 res.send("wrong link.try again")
//             }else{
//                 res.render("questionpaper",{qs:qs.questions})
//             }
//         })
//     }
// })
// app.post("/makeqs", upload.array('file', 12),function(req,res){
//     const id=req.body.id
//     if(req.file){const obj={
//         originalName:req.file.originalname,
//         mimeType:req.file.mimetype,
//         size:req.file.size,
//         fileName:req.file.filename
//     }}else{
//         obj=null;
//     }
//     const obj1={
//         question:req.body.qs,
//         file:obj,
//         mark:req.body.mark
//     }
//     if(req.body.btn==="add"){
//         Question.findById(id, function (err, qs) {
//             if(err){
//                 res.send("err")
//             }else{
//                 qs.questions.push(obj1)
//                 qs.save()
//                 res.redirect("/questionPaper/"+id)
//             }
//         })
//     }

//     console.log(req.files)
// })

app.post("/signup",function(req,res){
    User.register({username:req.body.username,email:req.body.email,type:req.body.type,fullname:req.body.fullname}, req.body.password, function(err,user){
        if(err){
            console.log(err)
            res.redirect("/signup")
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/home")
            })
        }
    })    
})


app.post("/information",function(req,res){
    req.user.fullname=req.body.fullname;
    req.user.username=req.body.username;
    req.user.type=req.body.type;
    req.user.save()
    res.redirect("/home")
})

app.post("/forgot",function(req,res){
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'teampaimon@gmail.com',
          pass: 'paimonialneeds'
        }
      });

      var generator = require('generate-password');
 
var password = generator.generate({
    length: 10,
    numbers: true
});
      var mailOptions = {
        from: 'teampaimon@gmail.com',
        to: req.body.email,
        subject: 'your new password',
        text: "Your new password is: "+password
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
      User.findOne({email:req.body.email},function(err,sanitizedUser){
        if (sanitizedUser){
            sanitizedUser.setPassword(password, function(){
                sanitizedUser.save();
                res.status(200).json({message: 'Password reset successful.Check email for your new password and login again'});
            });
        } else {
            res.status(500).json({message: 'This user does not exist'});
        }
      })
})

app.post("/login",function(req,res){
    var username=req.body.username;
    var isEmail=validator.isEmail(username);
    if(isEmail){
        User.findOne({email:username},function(err,profile){
            if(err){
                console.log(err)
            }
            else{
                const user=new User({
                    username:profile.username,
                    passwrod:req.body.password
                });
                req.login(user,function(err){
                    if(err){
                        console.log(err)
                    }else{
                        passport.authenticate("local")(req,res,function(){
                            res.redirect("/home")
                        })
                    }
                })
            }
        })
    }else{
        const user=new User({
            username:req.body.username,
            passwrod:req.body.password
        });
        req.login(user,function(err){
            if(err){
                console.log(err)
            }else{
                passport.authenticate("local")(req,res,function(){
                    res.redirect("/home")
                })
            }
        })
    }
})
app.post("/logout",function(req,res){
    req.logout();
    res.redirect("/login");
})

// app.post("/redirect",function(req,res){
//     if(req.body.btn==="makeqs"){
//         Question.create({ questions:[] }, function (err, qs) {
//             if (err) return handleError(err);
//             else{
//                 qs.save()
//                 res.redirect("/question/"+qs.id)
//             }
//           });
//     }
// })





app.listen("3000",function(err){
    if(err){
        console.log(err)
    }else{
        console.log("server started")
    }
})
