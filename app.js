require('dotenv').config();
var express         = require ("express"),
    app             = express(),
    bodyParser      = require("body-parser"),
    mongoose        = require("mongoose"),
    flash           = require("connect-flash"),
    passport        = require("passport"),
    LocalStrategy   = require("passport-local"),
    methodOverride  = require("method-override"),
    Trail           = require("./models/trail"),
    Comment         = require("./models/comment"),
    Photo           = require("./models/photo"),
    User            = require("./models/user");
    // seedDB          = require("./seeds");

//v12: Landing page background animation
//v13: UI Improvements (login and signup, nav-bar, registration flash 
//v14: Dynamic price(Trail length and elevation gain)
//v15: Time since created
//v16: Fuzzy search
//v17: jumbotron background on trails page and glyphicons
//v18: Collapsible Comment Section Upgrade
//v19: user profile
//v20: Password reset and profile page improvement
//v21: edit profile
//v22: image upload for trail create and edit
//v23: index page style and google maps
//v24: switch geocode and cloudinary callback orders
//v25: show page improvement added author info and tabs
//v26: images gallery with multiple trail photos added plus minor UI improvements
//v27: image upload added to image galley page, delete image added, check image ownership for delete icon, image model updated to have publicUrl
//v28: redirect to the same page added. login redirect added, curser zoom-in on the image gallery


//requiring routes
var commentRoutes = require("./routes/comments"),
    photoRoutes   = require("./routes/photos"),
    trailRoutes   = require("./routes/trails"),
    indexRoutes   = require("./routes/index");

mongoose.connect("mongodb://localhost/moon_trails_v27", { useNewUrlParser: true });
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname+ "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require("moment");//available in all view files
// seedDB();

// Passport cinfiguration
app.use(require("express-session")({
    secret: "My fish are dead!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use("/", indexRoutes);
app.use("/trails", trailRoutes);
app.use("/trails/:id/comments",commentRoutes);
app.use("/trails/:id/photos",photoRoutes);

app.listen(process.env.PORT,process.env.IP, function(){
    console.log("The MoonTrails Server has started");
});