import express from "express";
import morgan from "morgan";
import session from "express-session";
import flash from "express-flash";
import MongoStore from "connect-mongo";
import rootRouter from "./routers/rootRouter";
import userRouter from "./routers/userRouter";
import videoRouter from "./routers/videoRouter";
import { localsMiddleware } from "./middlewares";
import apiRouter from "./routers/apiRouter";

const logger = morgan("dev");

const app = express();

app.set("view engine", "pug");
app.set("views", process.cwd() + "/src/views");

app.use((req, res, next) => {
  res.header("Cross-Origin-Embedder-Policy", "require-corp");
  res.header("Cross-Origin-Opener-Policy", "same-origin");
  next();
});

app.use(logger);

// server will understand data in req.body comming from form.
app.use(express.urlencoded({ extended: true }));

// middleware that take string and parse it to json.
// => middleware that execute JSON.parse(req.body)
// the request must have headers that specify Content-Type as application/json.
app.use(express.json());

app.use(
  session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    /*
    cookie: {
      maxAge: 20000,
    },
    */
    store: MongoStore.create({ mongoUrl: process.env.DB_URL }),
  })
);

/* logging all the user's sessions that have been connected to our server.
app.use((req, res, next) => {
  req.sessionStore.all((error, sessions) => {
    console.log(sessions);
    next();
  });
});
*/

app.use(flash());
app.use(localsMiddleware);
app.use("/", rootRouter);
app.use("/uploads", express.static("uploads"));
app.use("/static", express.static("assets"));
app.use("/videos", videoRouter);
app.use("/users", userRouter);
app.use("/api", apiRouter);

export default app;
