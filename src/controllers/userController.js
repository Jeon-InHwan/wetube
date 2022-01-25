import User from "../models/User";
import bcrypt from "bcrypt";
import fetch from "node-fetch";
import Video from "../models/Video";

// http request : localhost:4000/join (GET)
export const getJoin = (req, res) => {
  return res.render("join", { pageTitle: "Join" });
};

// http request : localhost:4000/join (POST)
export const postJoin = async (req, res) => {
  const { name, email, username, password, passwordConfirmation, location } =
    req.body;

  if (password !== passwordConfirmation) {
    return res.status(400).render("join", {
      pageTitle: "Join",
      errorMessage: "Password Confirmation does not match!",
    });
  }

  const exists = await User.exists({
    $or: [{ email: email }, { username: username }],
  });
  if (exists) {
    return res.status(400).render("join", {
      pageTitle: "Join",
      errorMessage: "This email or username is already taken!",
    });
  }

  /*
  const emailExists = await User.exists({ email: email });
  if (emailExists) {
    return res.render("join", {
      pageTitle: "Join",
      errorMessage: "This email is already taken!",
    });
  }

  const usernameExists = await User.exists({ username: username });
  if (usernameExists) {
    return res.render("join", {
      pageTitle: "Join",
      errorMessage: "This username is already taken!",
    });
  }
  */

  try {
    await User.create({
      name: name,
      email: email,
      username: username,
      password: password,
      location: location,
    });
    return res.redirect("/login");
  } catch (error) {
    return res
      .status(400)
      .render("join", { pageTitle: "Join", errorMessage: error._message });
  }
};

// http request : localhost:4000/users/edit (GET)
export const getEdit = (req, res) => {
  return res.render("edit-profile", { pageTitle: "Edit Profile" });
};

// http request : localhost:4000/users/edit (POST)
export const postEdit = async (req, res) => {
  const { _id, avatarUrl } = req.session.user;
  const { name, email, username, location } = req.body;
  const uploadedfile = req.file;

  if (email !== req.session.user.email) {
    const emailExists = await User.exists({ email: email });
    if (emailExists) {
      return res.status(400).render("edit-profile", {
        pageTitle: "Edit Profile",
        errorMessage: "This email is already taken!",
      });
    }
  }

  if (username !== req.session.user.username) {
    const usernameExists = await User.exists({ username: username });
    if (usernameExists) {
      return res.status(400).render("edit-profile", {
        pageTitle: "Edit Profile",
        errorMessage: "This username is already taken!",
      });
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    _id,
    {
      avatarUrl: uploadedfile ? uploadedfile.path : avatarUrl,
      name: name,
      email: email,
      username: username,
      location: location,
    },
    // "new:true" makes findByIdAndUpdate() to return updated object
    { new: true }
  );
  req.session.user = updatedUser;
  /*
  req.session.user = {
    ...req.session.user,
    name: name,
    email: email,
    username: username,
    location: location,
  };
  */
  return res.redirect("/users/edit");
};

// http request : localhost:4000/login (GET)
export const getLogin = (req, res) => {
  return res.render("login", { pageTitle: "Login" });
};

// http request : localhost:4000/login (POST)
export const postLogin = async (req, res) => {
  const { username, password } = req.body;
  // 1. check if account exists
  const user = await User.findOne({ username: username, socialOnly: false });
  if (!user) {
    return res.status(400).render("login", {
      pageTitle: "Login",
      errorMessage: "An account with this username does not exist!",
    });
  }
  // 2. check if password exists
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(400).render("login", {
      pageTitle: "Login",
      errorMessage: "Wrong password!",
    });
  }
  req.session.loggedIn = true;
  req.session.user = user;
  return res.redirect("/");
};

// http request : localhost:4000/users/github/start (GET)
export const startGithubLogin = (req, res) => {
  const baseUrl = "https://github.com/login/oauth/authorize";
  const config = {
    client_id: process.env.GH_CLIENT,
    allow_signup: false,
    scope: "read:user user:email",
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  return res.redirect(finalUrl);
};

// http request : localhost:4000/users/github/finish (GET)
export const finishGithubLogin = async (req, res) => {
  const baseUrl = "https://github.com/login/oauth/access_token";
  const config = {
    client_id: process.env.GH_CLIENT,
    client_secret: process.env.GH_SECRET,
    code: req.query.code,
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  const data = await fetch(finalUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
  });
  const json = await data.json();
  if ("access_token" in json) {
    // access API
    const { access_token } = json;
    const apiUrl = "https://api.github.com";
    const userData = await (
      await fetch(`${apiUrl}/user`, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();
    console.log(userData);
    const emailData = await (
      await fetch(`${apiUrl}/user/emails`, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();
    const emailObj = emailData.find(
      (email) => email.primary === true && email.verified === true
    );
    if (!emailObj) {
      return res.redirect("/login");
    }
    /*
    In case the user already has his own account with password, 
    check if primary and verified github email matches with original account.
    if you can find match, let the user log in.
    if you can't find match, create an account.
    */
    let user = await User.findOne({ email: emailObj.email });
    if (!user) {
      user = await User.create({
        avatarUrl: userData.avatar_url,
        name: userData.name,
        email: emailObj.email,
        username: userData.login,
        password: "",
        socialOnly: true,
        location: userData.location,
      });
    }
    req.session.loggedIn = true;
    req.session.user = user;
    return res.redirect("/");
  } else {
    res.redirect("/login");
  }
};

// http request : localhost:4000/users/logout (GET)
export const logout = (req, res) => {
  req.session.user = null;
  res.locals.loggedInUser = req.session.user;
  req.session.loggedIn = false;
  req.flash("info", "Bye Bye");
  return res.redirect("/");
};

// http request : localhost:4000/users/change-password (GET)
export const getChangePassword = (req, res) => {
  // If user is logged in by social login, he cannot update his password
  if (req.session.user.socialOnly === true) {
    req.flash(
      "error",
      "As you logged in with social login, you can't change password!"
    );
    return res.redirect("/");
  }
  return res.render("users/change-password", { pageTitle: "Change password" });
};

// http request : localhost:4000/users/change-password (POST)
export const postChangePassword = async (req, res) => {
  const { _id, password } = req.session.user;
  const { oldPassword, newPassword, newPasswordConfirm } = req.body;
  const ok = await bcrypt.compare(oldPassword, password);
  if (!ok) {
    return res.status(400).render("users/change-password", {
      pageTitle: "Change password",
      errorMessage: "The current password is incorrect!",
    });
  }
  if (newPassword !== newPasswordConfirm) {
    return res.status(400).render("users/change-password", {
      pageTitle: "Change password",
      errorMessage: "The password does not match the confirmation!",
    });
  }
  const user = await User.findById(_id);
  user.password = newPassword;
  await user.save();
  // user.save() will trigger the pre-save middleware in User.js
  // which will hash the new password
  req.session.user.password = user.password;
  req.flash("info", "Password Updated");
  return res.redirect("/users/logout");
};

// http request : localhost:4000/users/:id (GET)
export const see = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).populate("videos");
  console.log(user);
  if (!user) {
    return res.status(404).render("404", { pageTitle: "User not found!" });
  }
  return res.render("users/profile", {
    pageTitle: `${user.name}'s Profile`,
    user: user,
  });
};
