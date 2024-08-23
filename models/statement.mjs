import mongoose from "mongoose";

let statementSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
    },
    previousAmount: {
      type: Number,
      // required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

let statementModel = mongoose.model("Statement", statementSchema);
export default statementModel;
