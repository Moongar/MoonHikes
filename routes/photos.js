var express = require("express");
var router = express.Router({mergeParams:true});
var Trail  = require("../models/trail");
var Photo= require("../models/photo");
var middleware= require("../middleware");

var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter});

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'dsh0nkpov', 
  api_key: "256139534486688", 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

//photos new form
router.get("/new", middleware.isLoggedIn, function(req, res) {
    Trail.findById(req.params.id,function(err,trail){
        if(err){
            console.log(err);
        } else {
            res.render("photos/new", {trail:trail});
        }
    });
});

//Photos create
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req,res){
    Trail.findById( req.params.id, function(err, trail) {
        if(err){
            console.log(err);
            res.redirect("/trails");
        } else {
            cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
              //eval(require("locus"));
              if(err) {
                req.flash('error', err.message);
                return res.redirect('back');
              }
              // add cloudinary urls for the image to the trail object under image property
              var photo = {url: result.secure_url, publicUrl:result.public_id};
              
                Photo.create(photo, function(err, photo){
                    if(err){
                        req.flash("error", "Something went wrong");
                        console.log(err);
                    } else {
                        //add username and id to photo
                        photo.author.id=req.user._id;
                        photo.author.username=req.user.username;
                        photo.author.avatar=req.user.avatar;
                        //save comment
                        photo.save();
                        trail.photos.push(photo);
                        trail.save();
                        req.flash("success", "Successfully added photo");
                        res.redirect("/trails/"+req.params.id);
                    }
                });
            });
        }
    });
});

//Destroy photo
router.delete("/:photo_id", function(req, res){
    Photo.findById(req.params.photo_id, async function(err, photo){
        if(err){
            return res.redirect("back");
        }
        try {
            await cloudinary.v2.uploader.destroy(photo.publicUrl);
            photo.remove();
            req.flash('success', 'Photo deleted successfully!');
            res.redirect('/trails/'+req.params.id);
        } catch(err) {
            if(err) {
              req.flash("error", err.message);
              return res.redirect("back");
            }
        }
        
    });
});

module.exports = router;