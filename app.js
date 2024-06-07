import express from "express";
const app = express();
import indexRouter from "./routes/indexRouter.js";
import dotenv from "dotenv";
dotenv.config();
import expressSession from "express-session";
import passport from "passport";
import userModel from "./models/userModel.js";
import cookieParser from "cookie-parser";

// db connection
import { connectDatabase } from "./models/database.js";
connectDatabase();

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger
import logger from "morgan";
app.use(logger("dev"));


import connectMongoDBSession from "connect-mongodb-session";
const MongoDBStore = connectMongoDBSession(expressSession);

// Use MongoDBStore to create a new instance of MongoStore
const store = new MongoDBStore({
  uri: process.env.MONGODB_URL, // MongoDB connection URI
  databaseName: "expenseTracker", // MongoDB database name
  collection: "sessions", // Collection to store sessions
});

// Passport code
app.use(
  expressSession({
    resave: false,
    saveUninitialized: false,
    secret: process.env.EXPRESS_SESSION_SECRET,
    cookie: {
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days in milliseconds
    },
    store: store,
  })
);
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());

// cookieParser
app.use(cookieParser());

// Routing
app.use("/", indexRouter);

// // Error Handling
// app.use((err, req, res, next) => {
//   console.error(err.message);
//   res.status(500).json({ message: err.message });
// });

// app.use("*", (req, res, next) => {
//   res.status(404).json({ message: "Route not found" });
// });

// Error Handling
import ErrorHandler from "./utils/ErrorHandler.js";
import { generatedErrors } from "./middlewares/error.js";
/*
404 - Page not found error
The server could not find the requested resource. 
*/
app.all("*", (req, res, next) => {
  next(new ErrorHandler("Requested Url Not Found", 404));
});

// Adding middleware to handle any errors that occur in our application
app.use(generatedErrors);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on ${process.env.PORT}`);
});
