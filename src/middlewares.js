import multer from "multer";
import multerS3 from "multer-s3";
import aws from "aws-sdk";

const isHeroku = process.env.NODE_ENV === "production";

const s3 = new aws.S3({
  credentials: {
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET,
  },
});

const s3ImageUploader = multerS3({
  s3: s3,
  bucket: "wetube-cloning-youtube/images",
  acl: "public-read",
});

const s3VideoUploader = multerS3({
  s3: s3,
  bucket: "wetube-cloning-youtube/videos",
  acl: "public-read",
});

// To make all the view template can use backend's data(here, the session data),
// insert the data in locals. (pug view engine can get data from locals)
export const localsMiddleware = (req, res, next) => {
  if (req.session.loggedIn) {
    res.locals.loggedIn = true;
  } else {
    res.locals.loggedIn = false;
  }
  res.locals.loggedInUser = req.session.user || {};
  res.locals.siteName = "Wetube";
  res.locals.isHeroku = isHeroku;

  next();
};

// when the user is logged in, let him go through.
// if the user is not logged in, redirect him to the login page.
export const protectorMiddleware = (req, res, next) => {
  if (req.session.loggedIn) {
    return next();
  } else {
    req.flash("error", "Not authorized! Please log in");
    return res.redirect("/login");
  }
};

// when the user is not logged in, let him go through.
// when the user is logged in, redirect him to the home page.
export const publicOnlyMiddleware = (req, res, next) => {
  if (!req.session.loggedIn) {
    return next();
  } else {
    req.flash("error", "Not authorized");
    return res.redirect("/");
  }
};

// This middleware is for the avatar file upload.
// this middleware is going to used in userRouter.
// it will save the file in "uploads" folder (file system)
// and then give that information to the controller (postEdit, req.file)
export const avatarUploadMiddleware = multer({
  dest: "uploads/avatars/",
  limits: {
    fileSize: 10000000,
  },
  storage: isHeroku ? s3ImageUploader : undefined,
});

export const videoUploadMiddleware = multer({
  dest: "uploads/videos/",
  limits: {
    fileSize: 80000000,
  },
  storage: isHeroku ? s3VideoUploader : undefined,
});
