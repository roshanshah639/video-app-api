import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}` || "",
      {}
    );

    // Log the connection success
    console.log(
      `DB Connected Successfully. At DB Host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    // Log the error
    console.error("DB Connection Failed! Make sure MongoDb is running", error);

    // exit process gracefully if error occurs
    process.exit(1);
  }
};

export default connectDB;
