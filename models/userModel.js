import mongoose from "mongoose";

let userSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      // Email validation regex
      validate: [/^\S+@\S+\.\S+$/, "Please fill a valid email address"],
    },
    password: {
      type: String,
      required: true,
    },
    salt: {
      type: String,
      required: true,
    },
    name: {
      firstname: String,
      lastname: String,
    },
    statements: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Statement",
      },
    ],
    totalIncome: { type: Number, default: 0 },
    totalExpense: { type: Number, default: 0 },
    remainingAmount: {
      type: Number,
      // required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

let userModel = mongoose.model("User", userSchema);

export default userModel;
