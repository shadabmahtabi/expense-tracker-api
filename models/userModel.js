import mongoose from "mongoose";
import plm from "passport-local-mongoose";

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

// Ensure the plugin uses the correct field for the username
userSchema.plugin(plm, { usernameField: "email" });

let userModel = mongoose.model("User", userSchema);

export default userModel;
