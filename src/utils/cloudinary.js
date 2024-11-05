import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    // if localFilePath is  present
    if (!localFilePath) return null;

    // upload file to cloudinar
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // Log the success
    console.log("File uploaded successfully on cloudinary", response.url);

    // delete the locally saved temp file
    fs.unlinkSync(localFilePath);

    // return the response
    return response;
  } catch (error) {
    // Log the error
    console.log("Failed to upload files on cloudinary", error);

    // delete the locally saved temp file
    fs.unlinkSync(localFilePath);

    // return null
    return null;
  }
};

export { uploadOnCloudinary };
