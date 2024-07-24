import express from "express";
import {
  addStatement,
  deleteStatement,
  homepage,
  updateStatement,
  userLogin,
  userRegister,
  viewStatements,
} from "../controllers/indexController.js";
const router = express.Router();
import userModel from "../models/userModel.js";
import verifytoken from '../middlewares/auth.js'

/**
 * @method GET
 * @route /
 * @desc Home Route
 */
router.get("/", verifytoken, homepage);

/**
 * @method POST
 * @route /login
 * @desc use for logging in a user
 */
router.post("/user/login", userLogin);

/**
 * @method POST
 * @route /register
 * @desc use for registering in a user
 */
router.post("/user/register", userRegister);

/**
 * @method POST
 * @route /add/statement
 * @desc use for adding a statement
 */
router.post("/add/statement", verifytoken, addStatement);

/**
 * @method GET
 * @route /view/statement
 * @desc use for adding a statement
 */
router.get("/view/statement", verifytoken, viewStatements);

/**
 * @method PUT
 * @route /update/statement/:id
 * @desc use for deleting a statement
 */
router.put("/update/statement/:id", verifytoken, updateStatement);

/**
 * @method DELETE
 * @route /delete/statement/:id
 * @desc use for deleting a statement
 */
router.delete("/delete/statement/:id", verifytoken, deleteStatement);

export default router;
