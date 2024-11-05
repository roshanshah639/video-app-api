import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/connectDb.js";

// load env.variables
dotenv.config({ path: "./.env" });

// server config
const PORT = process.env.PORT || 3000;

// connect to db
connectDB()
  .then(() => {
    // Listen for errors
    app.on("error", (error) => {
      console.error("DB Connection Error:", error);
    });

    // start server
    app.listen(PORT, () => {
      console.log(`Server is running on ${PORT}...`);
    });
  })
  .catch((error) => {
    console.error("Something went wrong while connecting to DB", error);
  });
