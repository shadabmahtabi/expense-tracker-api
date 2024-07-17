import passport from "passport";
import { catchAsynchErrors } from "../middlewares/catchAsynchErrors.js";
import userModel from "../models/userModel.js";
import statementModel from "../models/statement.js";
import ErrorHandler from "../utils/ErrorHandler.js";

// This is for showing homepage
export const homepage = catchAsynchErrors(async (req, res, next) => {
  res.json({
    status: true,
    response: req.user,
    // user: req.user
  });
});

// This controller is for logging in a user
export const userLogin = catchAsynchErrors(async (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Authentication error:", err);
      return next(new ErrorHandler(err.message, 500));
    }
    if (!user) {
      console.log("Authentication failed:", info.message);
      return res
        .status(400)
        .json({ status: false, response: "Incorrect email or password" });
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error("Login error:", err);
        return next(new ErrorHandler(err.message, 500));
      }
      console.log("User logged in:", user.email);
      return res.status(200).json({ status: true, response: user });
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
        return res.status(500).send({ status: false, response: err.message });
      }
      // If registration is successful, authenticate the user
      passport.authenticate("local")(req, res, () => {
        return res.status(200).json({ status: true, response: registeredUser });
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
        .json({
          status: false,
          response: "Please login to access the resource.",
        });
    }
    res.status(200).json({ status: true, response: "LoggedOut Successfully!" });
  });
});

// This controller is for adding statements
export const addStatement = catchAsynchErrors(async (req, res, next) => {
  const user = req.user;
  const { amount, type, ...rest } = req.body;
  const amountNum = parseFloat(amount); // Ensure amount is treated as a number

  const statement = new statementModel({
    ...rest,
    amount: amountNum,
    type,
    user: user._id,
    previousAmount: user.totalIncome - user.totalExpense,
  });

  const isIncome = type === "income";
  user.totalIncome += isIncome ? amountNum : 0;
  user.totalExpense += isIncome ? 0 : amountNum;
  user.remainingAmount += isIncome ? amountNum : -amountNum;

  await statement.save();
  user.statements.push(statement._id);
  await user.save();

  res.status(200).json({ status: true, response: statement });
});

// This controller is for viewing statements
export const viewStatements = catchAsynchErrors(async (req, res, next) => {
  const { statements } = await req.user.populate("statements");
  res.status(200).json({ status: true, response: statements });
});

// This controller is for updating statements
export const updateStatement = catchAsynchErrors(async (req, res, next) => {
  const { id } = req.params;
  const { amount, type, category, date, desc } = req.body;
  const user = req.user;

  if (!user.statements.includes(id)) {
    return next(new ErrorHandler("Statement not found!", 404));
  }

  const statement = await statementModel.findById(id);
  if (!statement) {
    return next(new ErrorHandler("Statement not found!", 404));
  }

  const amountNum = parseFloat(amount); // Ensure amount is treated as a number

  const adjustUserAmounts = (amount, isIncome, add) => {
    const amountValue = parseFloat(amount); // Ensure amount is treated as a number
    if (isIncome) {
      user.totalIncome += add ? amountValue : -amountValue;
      user.remainingAmount += add ? amountValue : -amountValue;
    } else {
      user.totalExpense += add ? amountValue : -amountValue;
      user.remainingAmount += add ? -amountValue : amountValue;
    }
  };

  adjustUserAmounts(statement.amount, statement.type === "income", false);
  adjustUserAmounts(amountNum, type === "income", true);

  Object.assign(statement, {
    amount: amountNum,
    type,
    category,
    date,
    desc,
    previousAmount: user.totalIncome - user.totalExpense,
  });

  await statement.save();
  await user.save();

  res.status(200).json({ status: true, response: statement });
});

// This controller is for deleting statements
export const deleteStatement = catchAsynchErrors(async (req, res, next) => {
  const { id } = req.params;
  const user = req.user;

  if (!user.statements.includes(id)) {
    return next(new ErrorHandler("Statement not found!", 404));
  }

  const statement = await statementModel.findByIdAndDelete(id);
  if (!statement) {
    return next(new ErrorHandler("Statement not found!", 404));
  }

  const adjustUserAmounts = (amount, isIncome) => {
    if (isIncome) {
      user.totalIncome -= amount;
      user.remainingAmount -= amount;
    } else {
      user.totalExpense -= amount;
      user.remainingAmount += amount;
    }
  };

  adjustUserAmounts(statement.amount, statement.type === "income");

  user.statements = user.statements.filter(
    (sid) => sid.toString() !== id.toString()
  );

  await user.save();

  res.status(200).json({ status: true, response: statement });
});
