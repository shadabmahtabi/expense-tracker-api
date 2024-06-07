import passport from "passport";
import { catchAsynchErrors } from "../middlewares/catchAsynchErrors.js";
import userModel from "../models/userModel.js";
import statementModel from "../models/statement.js";

// This is for showing homepage
export const homepage = catchAsynchErrors(async (req, res, next) => {
  res.json({
    message: "Secure homepage",
    user: req.user,
    // user: req.user
  });
});

// This controller is for logging in a user
export const userLogin = catchAsynchErrors(async (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Authentication error:", err);
      return next(err);
    }
    if (!user) {
      console.log("Authentication failed:", info.message);
      return res.status(400).json({ message: "Incorrect email or password" });
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }
      console.log("User logged in:", user.email);
      return res.status(200).json({ message: "LoggedIn Successfully." });
    });
  })(req, res, next);
});

// This controller is for registering a user
export const userRegister = catchAsynchErrors(async (req, res, next) => {
  // Create a new user instance
  var newUser = new userModel({
    email: req.body.email,
    name: {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
    },
  });

  // Register the new user with passport-local-mongoose
  userModel.register(
    newUser,
    req.body.password,
    function (err, registeredUser) {
      if (err) {
        return res.status(500).send(err.message);
      }
      // If registration is successful, authenticate the user
      passport.authenticate("local")(req, res, () => {
        return res
          .status(200)
          .json({ message: "Registered Successfully!", user: registeredUser });
      });
    }
  );
});

// This controller is for logging out a user
export const userLogout = catchAsynchErrors(async function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return res
        .status(500)
        .json({ message: "Please login to access the resource." });
    }
    res.status(200).json({ message: "LoggedOut Successfully!" });
  });
});

// This controller is for adding statements
export const addStatement = catchAsynchErrors(async function (req, res, next) {
  let user = req.user;
  let statement = new statementModel({
    ...req.body,
    user: user._id,
    previousAmount: user.totalIncome - user.totalExpense,
  });

  if (statement.type === "income") {
    user.totalIncome += statement.amount;
    user.remainingAmount += statement.amount;
  } else {
    user.totalExpense += statement.amount;
    user.remainingAmount -= statement.amount;
  }

  await statement.save(); // Ensure statement is saved to the database
  user.statements.push(statement._id);
  await user.save(); // Ensure user is updated with new statement

  res.status(200).json({ status: true, statement });
});

// This controller is for viewing statements
export const viewStatements = catchAsynchErrors(async function (req, res, next) {
  
  let { statements } = await req.user.populate("statements")

  res.status(200).json({ status: true, statements });
});

// This controller is for updating statements
export const updateStatement = catchAsynchErrors(async function (req, res, next) {
  
  await statementModel.findByIdAndUpdate(req.params.id, req.body);

  let statement = await statementModel.findById(req.params.id);

  res.status(200).json({ status: true, statement });
});

// This controller is for deleting statements
export const deleteStatement = catchAsynchErrors(async function (req, res, next) {
  
  let statement = await statementModel.findByIdAndDelete(req.params.id);

  res.status(200).json({ status: true, statement });
});
