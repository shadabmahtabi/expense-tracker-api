import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const verifyToken = async (req, res, next) => {
  try {
    let token = req.header("Authorization")?.replace("Bearer ", "");

    if (token.startsWith('"') && token.endsWith('"')) {
      token = token.slice(1, -1);
    }

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("Decoded Token:", decoded);
    req.userId = decoded.userId;

    const user = await userModel.findById(req.userId).exec();
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // console.log({ user: user });

    req.user = { ...user };

    next();
  } catch (err) {
    console.error("JWT Verification Error:", err);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" });
    }
    return res.status(401).json({ message: "Token is not valid" });
  }
};

export default verifyToken;
