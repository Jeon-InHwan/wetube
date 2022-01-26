import User from "../models/User";
import Video from "../models/Video";
import Comment from "../models/Comment";

/*  callback functions & async/await 

    Video.find({}, (error, videos) => {
        if(error) {
          return res.render("errorPage");
        }
        return res.render("home", { pageTitle: "Home", videos });
    });

    Video.find() gives us a callback function (upgraded as promise)
    which is activated when DB things are done.
    And we are rendering Home after the DB process,
    because we don't want to render Home before the DB process.

    Javascript processes things asynchronously.
    If you don't want that, we have to use callback functions or promises.
    Using async & await, you can process things synchronously. 

  */

// http request : localhost:4000/ (GET)
export const home = async (req, res) => {
  try {
    const videos = await Video.find({})
      .sort({ createdAt: "desc" })
      .populate("owner");
    return res.render("home", { pageTitle: "Home", videos });
  } catch (error) {
    return res.render("serverErrorPage", { errMsg: error });
  }
};

// http request : localhost:4000/videos/:id (GET)
export const watch = async (req, res) => {
  const id = req.params.id;
  const video = await Video.findById(id).populate("owner").populate("comments");
  // .populate("owner") bring User Object using ref and ObjectId in Video.js

  if (video) {
    return res.render("watch", {
      pageTitle: video.title,
      video: video,
    });
  } else {
    return res.status(404).render("404", { pageTitle: "Video Not Found" });
  }
};

// http request : localhost:4000/videos/:id/edit (GET)
export const getEdit = async (req, res) => {
  const id = req.params.id;
  const video = await Video.findById(id);
  if (!video) {
    return res.status(404).render("404", { pageTitle: "Video Not Found" });
  }
  if (String(video.owner) !== String(req.session.user._id)) {
    return res.status(403).redirect("/");
  }
  return res.render("edit", {
    pageTitle: `Edit: ${video.title}`,
    video: video,
  });
};

// http request : localhost:4000/videos/:id/edit (POST)
export const postEdit = async (req, res) => {
  const {
    user: { _id },
  } = req.session;
  const { id } = req.params;
  const { title, description, hashtags } = req.body;

  const video = await Video.findById(id);

  if (!video) {
    return res.status(404).render("404", { pageTitle: "Video not found." });
  }

  if (String(video.owner._id) !== String(_id)) {
    req.flash("error", "You are not the the owner of the video.");
    return res.status(403).redirect("/");
  }

  await Video.findByIdAndUpdate(id, {
    title,
    description,
    hashtags: Video.formatHashtags(hashtags),
  });

  req.flash("success", "Changes saved");

  return res.redirect(`/videos/${id}`);
};

// http request : localhost:4000/videos/upload (GET)
export const getUpload = (req, res) => {
  return res.render("upload", { pageTitle: "Upload Video" });
};

// http request : localhost:4000/videos/upload (POST)
export const postUpload = async (req, res) => {
  const { title, description, hashtags } = req.body;
  const { video, thumb } = req.files;
  const { _id } = req.session.user;
  try {
    const newVideo = await Video.create({
      title,
      description,
      hashtags: Video.formatHashtags(hashtags),
      fileUrl: video[0].location,
      thumbUrl: thumb[0].location,
      owner: _id,
    });
    const user = await User.findById(_id);
    user.videos.push(newVideo._id);
    user.save();
    return res.redirect("/");
  } catch (error) {
    return res.status(400).render("upload", {
      pageTitle: "Upload Video",
      errorMessage: error._message,
    });
  }
};

// http request : localhost:4000/videos/:id/delete (GET)
export const deleteVideo = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id);
  if (!video) {
    return res.status(404).render("404", { pageTitle: "Video Not Found" });
  }
  if (String(video.owner) !== String(req.session.user._id)) {
    req.flash("error", "Not authorized (Not the owner of the video)");
    return res.status(403).redirect("/");
  }
  await Video.findByIdAndDelete(id);
  res.redirect("/");
};

// http request : localhost:4000/search (GET)
export const search = async (req, res) => {
  const { keyword } = req.query;
  let videos = [];
  if (keyword) {
    // we are going to search right here and "i" in RegExp means ignore case
    videos = await Video.find({
      title: {
        $regex: new RegExp(`${keyword}`, "i"),
      },
    })
      .populate("owner")
      .sort({ createdAt: "desc" });
  }
  return res.render("search", { pageTitle: "Search", videos: videos });
};

// video view update request like api => localhost:4000/api/videos/:id/view (POST)
export const registerView = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id);
  if (!video) {
    return res.sendStatus(404);
  }
  video.meta.views = video.meta.views + 1;
  await video.save();
  return res.sendStatus(200);
};

// Create video comment request like api => localhost:4000/api/videos/:id/comment (POST)
export const createComment = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const { user } = req.session;

  const video = await Video.findById(id);
  const userInDB = await User.findById(user._id);

  if (!video) {
    req.flash("error", "Can't post a comment now");
    return res.sendStatus(404);
  }

  if (!userInDB) {
    req.flash("error", "Can't post a comment now");
    return res.sendStatus(404);
  }

  // we have to send new comment id to the front end!!!
  const comment = await Comment.create({
    text: text,
    owner: user._id,
    video: id,
  });

  video.comments.push(comment._id);
  video.save();
  userInDB.comments.push(comment._id);
  userInDB.save();

  return res.status(201).json({ newCommentId: comment._id });
};

export const deleteComment = async (req, res) => {
  const { id } = req.params;
  const { user } = req.session;
  const { commentId } = req.body;

  const video = await Video.findById(id);
  const userInDB = await User.findById(user._id);
  const comment = await Comment.findById(commentId);

  if (!video) {
    req.flash("error", "Can't delete a comment now");
    return res.sendStatus(404);
  }

  if (!userInDB) {
    req.flash("error", "Can't delete a comment now");
    return res.sendStatus(404);
  }

  if (String(comment.owner) !== String(req.session.user._id)) {
    req.flash("error", "Can't delete a comment");
    return res.sendStatus(404);
  }

  await Comment.findByIdAndDelete(commentId);
  video.comments.pull(commentId);
  video.save();
  userInDB.comments.pull(commentId);
  userInDB.save();

  return res.sendStatus(201);
};
