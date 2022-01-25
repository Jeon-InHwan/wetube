import express from "express";

import {
  getEdit,
  postEdit,
  logout,
  startGithubLogin,
  finishGithubLogin,
  see,
  getChangePassword,
  postChangePassword,
} from "../controllers/userController";

import {
  avatarUploadMiddleware,
  protectorMiddleware,
  publicOnlyMiddleware,
} from "../middlewares";

const userRouter = express.Router();

userRouter
  .route("/edit")
  .all(protectorMiddleware)
  .get(getEdit)
  .post(avatarUploadMiddleware.single("avatar"), postEdit);
// "avatar" is a input name from edit-profile.pug //

userRouter.get("/logout", protectorMiddleware, logout);
userRouter.get("/github/start", publicOnlyMiddleware, startGithubLogin);
userRouter.get("/github/finish", publicOnlyMiddleware, finishGithubLogin);

userRouter
  .route("/change-password")
  .all(protectorMiddleware)
  .get(getChangePassword)
  .post(postChangePassword);

userRouter.get("/:id", see);

export default userRouter;
