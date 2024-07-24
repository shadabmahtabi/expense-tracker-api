import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const verifytoken = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Mo token, Authorization denied" });
  }

  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = userId;
    req.user = await userModel.findById({ _id: userId }).exec();
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" });
    }
    return res.status(401).json({ message: "Token is not valid" });
  }
};

export default verifytoken;
