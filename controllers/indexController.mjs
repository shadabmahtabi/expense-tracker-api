import { catchAsynchErrors } from "../middlewares/catchAsynchErrors.mjs";
import userModel from "../models/userModel.mjs";
import statementModel from "../models/statement.mjs";
import ErrorHandler from "../utils/ErrorHandler.mjs";
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

// This is for showing homepage
export const findUserById = async (req, res, next) => {
  const { id } = req.params;
  const findUser = users[id];
  if (!findUser) return res.sendStatus(404);
  return res.json(findUser);
};

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
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  // console.log("Generated Token:", token);
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
  let sortedStatements = statements.sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  res.status(200).json({ status: true, response: sortedStatements });
});

// This controller is for updating statements
export const updateStatement = catchAsynchErrors(async (req, res, next) => {
  const { id } = req.params;
  const { amount, type, category, date, description } = req.body;
  const user = await userModel.findOne({ _id: req.userId }).exec();

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

  adjustUserAmounts(statement.amount, statement.type === "Income", false);
  adjustUserAmounts(amountNum, type === "Income", true);

  Object.assign(statement, {
    amount: amountNum,
    type,
    category,
    date,
    desc: description,
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

export const filterStatements = catchAsynchErrors(async (req, res, next) => {
  const {
    type,
    category,
    desc,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    orderType,
  } = req.body;

  const query = {
    user: req.userId,
  };
  if (type) {
    query.type = type;
  }
  if (category) {
    query.category = category;
  }
  if (desc) {
    console.log(desc)
    query.desc = new RegExp(desc, 'i');
  }
  if (startDate && endDate) {
    query.date = { $gte: startDate, $lte: endDate };
  }
  if (minAmount && maxAmount) {
    query.amount = {
      $gte: parseFloat(minAmount),
      $lte: parseFloat(maxAmount),
    };
  }

  const filteredStatements = await statementModel.find(query).exec();

  if (orderType === "asc") {
    filteredStatements.sort((a, b) => a.amount - b.amount);
    return res.status(200).json({ status: true, response: filteredStatements });
  } else if (orderType === "dsc") {
    filteredStatements.sort((a, b) => b.amount - a.amount);
    return res.status(200).json({ status: true, response: filteredStatements });
  } else {
    return res.status(200).json({ status: true, response: filteredStatements });
  }
});

const users = [
  { id: 1, username: "user1", name: "John Doe", email: "johndoe1@example.com" },
  {
    id: 2,
    username: "user2",
    name: "Jane Smith",
    email: "janesmith2@example.com",
  },
  {
    id: 3,
    username: "user3",
    name: "Jim Brown",
    email: "jimbrown3@example.com",
  },
  {
    id: 4,
    username: "user4",
    name: "Lisa White",
    email: "lisawhite4@example.com",
  },
  {
    id: 5,
    username: "user5",
    name: "Tom Green",
    email: "tomgreen5@example.com",
  },
  {
    id: 6,
    username: "user6",
    name: "Susan Blue",
    email: "susanblue6@example.com",
  },
  {
    id: 7,
    username: "user7",
    name: "Kevin Black",
    email: "kevinblack7@example.com",
  },
  {
    id: 8,
    username: "user8",
    name: "Nancy Silver",
    email: "nancysilver8@example.com",
  },
  {
    id: 9,
    username: "user9",
    name: "Robert Gold",
    email: "robertgold9@example.com",
  },
  {
    id: 10,
    username: "user10",
    name: "Maria Pink",
    email: "mariapink10@example.com",
  },
  {
    id: 11,
    username: "user11",
    name: "Steve Brown",
    email: "stevebrown11@example.com",
  },
  {
    id: 12,
    username: "user12",
    name: "Rachel White",
    email: "rachelwhite12@example.com",
  },
  {
    id: 13,
    username: "user13",
    name: "Paul Green",
    email: "paulgreen13@example.com",
  },
  {
    id: 14,
    username: "user14",
    name: "Laura Blue",
    email: "laurablue14@example.com",
  },
  {
    id: 15,
    username: "user15",
    name: "David Black",
    email: "davidblack15@example.com",
  },
  {
    id: 16,
    username: "user16",
    name: "Amy Silver",
    email: "amysilver16@example.com",
  },
  {
    id: 17,
    username: "user17",
    name: "George Gold",
    email: "georgegold17@example.com",
  },
  {
    id: 18,
    username: "user18",
    name: "Sara Pink",
    email: "sarapink18@example.com",
  },
  {
    id: 19,
    username: "user19",
    name: "Brian Brown",
    email: "brianbrown19@example.com",
  },
  {
    id: 20,
    username: "user20",
    name: "Diana White",
    email: "dianawhite20@example.com",
  },
];
