export function generatedErrors(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  if (err.name === "MongoServerError") {
    if (err.message.includes("email_1 dup key")) {
      err.message = "User already exists with this email.";
    } else if (err.message.includes("phoneNumber_1 dup key")) {
      err.message = "User already exists with this phone number.";
    }
  }

  res.status(statusCode).json({
    message: err.message,
    error: err.name,
    //   stack: err.stack
  });
}
