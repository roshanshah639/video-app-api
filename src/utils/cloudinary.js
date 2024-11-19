import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// upload on cloudinary method
const uploadOnCloudinary = async (localFilePath) => {
  try {
    // if local file path is not present
    if (!localFilePath) return null;

    // upload file to cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // log the success
    console.log(
      "File has been uploaded to cloudiary successfully",
      response.url
    );

    // delete the locally saved temp file rom server
    fs.unlinkSync(localFilePath);

    // return the response
    return response;
  } catch (error) {
    // Log the error
    console.error("Failed to upload file to cloudinary", error);

    // delete the locally saved temp file rom server
    fs.unlinkSync(localFilePath);

    // return null
    return null;
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    // if public id is not present
    if (!publicId) return null;

    // delete file from cloudinary
    const response = await cloudinary.uploader.destroy(publicId);

    // log the success
    console.log(
      "File has been deleted from cloudiary successfully",
      response.url
    );

    // return response
    // return response;
  } catch (error) {
    // Log the errors
    console.error("Failed to delete file from cloudinary", error);

    // return null
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
