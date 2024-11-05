import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    // create connection instance
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}` || ""
    );

    // Log the connection success
    console.log(
      `DB Connected Successfully! At DB Host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("DB Connection Failed! Make sure MongoDB is running!", error);

    // exit process graceully with failure
    process.exit(1);
  }
};

export default connectDB;
