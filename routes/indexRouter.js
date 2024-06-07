import express from "express";
import {
  addStatement,
  deleteStatement,
  homepage,
  updateStatement,
  userLogin,
  userLogout,
  userRegister,
  viewStatements,
} from "../controllers/indexController.js";
const router = express.Router();
import userModel from "../models/userModel.js";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    function (email, password, done) {
      userModel.authenticate()(email, password, function (err, user, info) {
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false, {
            message: "Incorrect email or password",
          });
        }
        return done(null, user);
      });
    }
  )
);

/**
 * @method GET
 * @route /
 * @desc Home Route
 */
router.get("/", isLoggedIn, homepage);

/**
 * @method POST
 * @route /login
 * @desc use for logging in a user
 */
router.post("/login", userLogin);

/**
 * @method POST
 * @route /register
 * @desc use for registering in a user
 */
router.post("/register", userRegister);

/**
 * @method GET
 * @route /logout
 * @desc use for logging out a user
 */
router.get("/logout", isLoggedIn, userLogout);

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    return res
      .status(500)
      .json({ message: "Please login to access the resource." });
  }
}

/**
 * @method POST
 * @route /add/statement
 * @desc use for adding a statement
 */
router.post("/add/statement", isLoggedIn, addStatement);

/**
 * @method GET
 * @route /view/statement
 * @desc use for adding a statement
 */
router.get("/view/statement", isLoggedIn, viewStatements);

/**
 * @method PUT
 * @route /update/statement/:id
 * @desc use for deleting a statement
 */
router.put("/update/statement/:id", isLoggedIn, updateStatement);

/**
 * @method DELETE
 * @route /delete/statement/:id
 * @desc use for deleting a statement
 */
router.delete("/delete/statement/:id", isLoggedIn, deleteStatement);

export default router;
