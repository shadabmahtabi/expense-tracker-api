import express from "express";
const app = express();
import indexRouter from "./routes/indexRouter.js";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";

// db connection
import { connectDatabase } from "./models/database.js";
connectDatabase();

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger
import logger from "morgan";
app.use(logger("dev"));

// Enabling cors policy
app.use(
  cors({
    // origin: 'http://localhost:5173', // Your React app's URL
    origin: process.env.FRONTEND_URL, // Your React app's URL
    credentials: true, // Enable credentials (cookies)
  })
);

// Routing
app.use("/api/", indexRouter);

// Error Handling
import ErrorHandler from "./utils/ErrorHandler.js";
import { generatedErrors } from "./middlewares/error.js";
/*
404 - Page not found error
The server could not find the requested resource. 
*/
app.all("*", (req, res, next) => {
  next(new ErrorHandler("Requested Url Not Found", 404));
});

// Adding middleware to handle any errors that occur in our application
app.use(generatedErrors);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on ${process.env.PORT}`);
});
