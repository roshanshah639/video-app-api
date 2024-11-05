import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/connectDb.js";

// load env.variables
dotenv.config({ path: "./.env" });

// server config
const PORT = process.env.PORT || 3000;
const HOST_NAME = process.env.HOST_NAME || "localhost";

// connect to db
connectDB()
  .then(() => {
    // Listen for errors
    app.on("error", (error) => {
      console.error("DB Connection Error:", error);
    });

    // start server
    app.listen(PORT, HOST_NAME, () => {
      console.log(`Server is running on http://${HOST_NAME}:${PORT}...`);
    });
  })
  .catch((error) => {
    console.error("Something went wrong while connecting to DB", error);
  });
