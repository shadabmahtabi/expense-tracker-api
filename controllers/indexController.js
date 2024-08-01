import { catchAsynchErrors } from "../middlewares/catchAsynchErrors.js";
import userModel from "../models/userModel.js";
import statementModel from "../models/statement.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// This is for showing homepage
export const homepage = catchAsynchErrors(async (req, res, next) => {
  const { name, _id, totalExpense, totalIncome, remainingAmount } = req.user;

  res.json({
    status: true,
    response: { name, _id, totalExpense, totalIncome, remainingAmount },
  });
});

// This controller is for logging in a user
export const userLogin = catchAsynchErrors(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await userModel
    .findOne({ email: email })
    .select("+password +salt")
    .exec();
  if (!user) return next(new ErrorHandler("User not found", 404));
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return next(new ErrorHandler("Password is incorrect", 404));
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });
  console.log("Generated Token:", token);
  // res.cookie("jwt", token, { httpOnly: true, maxAge: 3 * 24 * 60 * 60 * 1000 });
  res.status(200).json({
    status: true,
    response: token,
  });
});

// This controller is for registering a user
export const userRegister = catchAsynchErrors(async (req, res, next) => {
  // User details from body
  const { email, password, firstname, lastname } = req.body;

  // hashing password
  let salt = await bcrypt.genSalt(10);
  let hashedPassword = bcrypt.hashSync(password, salt);

  // Create a new user instance
  var newUser = new userModel({
    email,
    name: {
      firstname,
      lastname,
    },
    password: hashedPassword,
    salt,
  });
  await newUser.save();

  // JWT
  const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  console.log("Generated Token:", token);

  return res.status(201).json({ status: true, response: token });
});

// This controller is for adding statements
export const addStatement = catchAsynchErrors(async (req, res, next) => {
  const user = await userModel.findById(req.userId).exec();
  const { amount, type, description, ...rest } = req.body;
  const amountNum = parseFloat(amount);

  // Validate amount
  if (isNaN(amountNum)) {
    return res
      .status(400)
      .json({ status: false, message: "Invalid amount value." });
  }

  // console.log(user);
  // Validate totalIncome and totalExpense
  const totalIncome = user.totalIncome || 0;
  const totalExpense = user.totalExpense || 0;

  const previousAmount = totalIncome - totalExpense;

  if (isNaN(previousAmount)) {
    return res
      .status(500)
      .json({ status: false, message: "Invalid previous amount calculation." });
  }

  const statement = new statementModel({
    ...rest,
    amount: amountNum,
    type,
    desc: description,
    user: user._id,
    previousAmount: previousAmount,
  });

  const isIncome = type === "Income";
  user.totalIncome = totalIncome + (isIncome ? amountNum : 0);
  user.totalExpense = totalExpense + (isIncome ? 0 : amountNum);
  user.remainingAmount += isIncome ? amountNum : -amountNum;

  await statement.save();
  user.statements.push(statement._id);
  await user.save();

  res.status(200).json({ status: true, response: "Statement added." });
});

// This controller is for viewing statements
export const viewStatements = catchAsynchErrors(async (req, res, next) => {
  const statements = await statementModel.find({ user: req.userId }).exec();
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
  const user = await userModel.findOne({ _id: req.userId }).exec();

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

  adjustUserAmounts(statement.amount, statement.type === "Income");

  user.statements = user.statements.filter(
    (sid) => sid.toString() !== id.toString()
  );

  await user.save();

  res.status(200).json({ status: true, response: statement });
});
