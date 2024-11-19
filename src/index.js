// import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/connectDb.js";

// load env variables
// dotenv.config({ path: "./.env" });

// server config
const PORT = process.env.PORT || 7070;
// const HOST_NAME = process.env.HOST_NAME || "localhost";

// connect to db
connectDB()
  .then(() => {
    // listen for errors
    app.on("error", (error) => {
      console.error("Server Error", error);
    });

    // start server
    app.listen(PORT, () => {
      console.log(`Server is running on ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("DB Connection Error!", error);
  });
