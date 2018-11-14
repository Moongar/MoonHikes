var express = require("express");
var router = express.Router();
var Trail  = require("../models/trail");
var User  = require("../models/user");
var middleware= require("../middleware");
var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

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
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

//INDEX show all trails
router.get("/", function(req,res){
    var noMatch;
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), "gi");
        Trail.find({name: regex},function(err,allTrails){
            if(err){
                console.log(err);
            } else {
                if(allTrails.length<1){
                    noMatch="No trails found, please try another search query.";
                }
                res.render("trails/index", {trails:allTrails, page: "trails", noMatch:noMatch});
            }
        });
    } else {
        Trail.find({},function(err,allTrails){
            if(err){
                console.log(err);
            } else {
                res.render("trails/index", {trails:allTrails, page: "trails", noMatch:"no search"});
            }
        });
    }
});

//CREATE add new trail to database
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req,res){
    geocoder.geocode(req.body.location, function (err, data) {
      if (err || !data.length) {
        req.flash('error', 'Invalid address');
        return res.redirect('back');
      }
      cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
      //eval(require("locus"));
      if(err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
      // add cloudinary url for the image to the trail object under image property
      req.body.trail.image = result.secure_url;
      // add image's public_id to campground object
      req.body.trail.imageId = result.public_id;
      // add author to trail
      req.body.trail.author = {
        id: req.user._id,
        username: req.user.username
      };
      req.body.trail.lat = data[0].latitude;
      req.body.trail.lng = data[0].longitude;
      req.body.trail.location = data[0].formattedAddress;
      Trail.create(req.body.trail, function(err, trail) {
        if (err) {
          req.flash('error', err.message);
          return res.redirect('back');
        }
        req.flash('success', "successfully created the new trail");
        res.redirect('/trails/' + trail.id);
      });
    });
  });
});

//NEW show form to create new trail
router.get("/new", middleware.isLoggedIn, function(req,res){
    res.render("trails/new");
});

//SHOW shows more info about one trail
router.get("/:id",function(req,res){
    Trail.findById(req.params.id).populate("comments").populate("photos").exec(function(err,foundTrail){
        if(err || !foundTrail){
            req.flash("error", "Trail not found");
            res.redirect("back");
        } else {
            User.findById(foundTrail.author.id, function(err, foundUser) {
                if(err){
                    req.flash("error", "Trail author not found");
                    return res.redirect("back");
                }
                res.render("trails/show",{trail:foundTrail, authorAvatar:foundUser.avatar});
            });
            
        }
    });
});

//Edit trail
router.get("/:id/edit", middleware.checkTrailOwnership,function(req, res) {
    Trail.findById(req.params.id, function(err, foundTrail){
        if(err || !foundTrail){
            req.flash("error", "Sorry, that trail doesn't exist");
        }
        res.render("trails/edit", {trail: foundTrail});
    });
});

//Update trail
router.put("/:id", middleware.checkTrailOwnership, upload.single("image"), function(req, res) {
    Trail.findById(req.params.id, function(err, updatedTrail){
        if(err){
          req.flas("error, err.message");
          res.redirect("/trails");
        } else {
          geocoder.geocode(req.body.location, async function (err, data) {
            if (err || !data.length) {
              req.flash('error', 'Invalid address');
              return res.redirect('back');
            }
            req.body.trail.lat = data[0].latitude;
            req.body.trail.lng = data[0].longitude;
            req.body.trail.location = data[0].formattedAddress;
            if(req.file) {
              try{
                await cloudinary.v2.uploader.destroy(updatedTrail.imageId);
                var result = await cloudinary.v2.uploader.upload(req.file.path);
                req.body.trail.image = result.secure_url;
                req.body.trail.imageId = result.public_id;
              } catch(err){
                req.flash("error, err.message");
                return res.redirect("/trails");
              }
            }
          Trail.findByIdAndUpdate(req.params.id, req.body.trail, function(err, trail){
              if(err){
                  req.flash("error", err.message);
                  res.redirect("back");
              } else {
                  req.flash("success","Successfully Updated!");
                  res.redirect("/trails/" + trail._id);
              }
          });
        });
    }
  });
});

//Destroy trail
router.delete("/:id", middleware.checkTrailOwnership, function(req, res){
    Trail.findById(req.params.id, async function(err, trail){
        if(err){
          req.flash("error", err.message);
          return res.redirect("/trails");
        }
        try {
            await cloudinary.v2.uploader.destroy(trail.imageId);
            trail.remove();
            req.flash('success', 'Trail deleted successfully!');
            res.redirect('/trails');
        } catch(err) {
            if(err) {
              req.flash("error", err.message);
              return res.redirect("back");
            }
        }
    });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;