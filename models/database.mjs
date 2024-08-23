import { connect } from "mongoose";

export async function connectDatabase(req, res, next) {
  try {
    connect(process.env.MONGODB_URL);
    console.log("Database Connection Established!");
  } catch (error) {
    if (
      error.name === "MongoParseError" &&
      error.message.includes(
        "Invalid scheme, expected connection string to start with"
      )
    ) {
      console.error(`Invalid Database URL: ${process.env.MONGODB_URL}`);
    }
  }
}
