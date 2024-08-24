import express from "express";
import {
  addStatement,
  deleteStatement,
  filterStatements,
  findUserById,
  homepage,
  updateStatement,
  userLogin,
  userRegister,
  viewStatements,
} from "../controllers/indexController.mjs";
const router = express.Router();
import userModel from "../models/userModel.mjs";
import verifytoken from '../middlewares/auth.mjs'

/**
 * @method GET
 * @route /
 * @desc Home Route
 */
router.get("/user", verifytoken, homepage);

/**
 * @method GET
 * @route /
 * @desc Finding user by id
 */
router.get("/user/:id", findUserById);

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
 * @route /statement/add
 * @desc use for adding a statement
 */
router.post("/statement/add", verifytoken, addStatement);

/**
 * @method GET
 * @route /statement/view
 * @desc use for adding a statement
 */
router.get("/statement/view", verifytoken, viewStatements);

/**
 * @method PUT
 * @route /statement/update/:id
 * @desc use for deleting a statement
 */
router.put("/statement/update/:id", verifytoken, updateStatement);

/**
 * @method DELETE
 * @route /statement/delete/:id
 * @desc use for deleting a statement
 */
router.delete("/statement/delete/:id", verifytoken, deleteStatement);

/**
 * @method POST
 * @route /statements/filter
 * @desc use for deleting a statement
 */
router.post("/statements/filter", verifytoken, filterStatements);

export default router;
