import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { UserModel } from "../models/user.models.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { VideoModel } from "../models/video.models.js";
import { v2 as cloudinary } from "cloudinary";

const addVideo = asyncHandler(async (req, res) => {
  // extract details from request/from body
  const { title, description, category, tags } = req.body;

  // validations - fields are required
  if (
    [title, description, category, tags].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // find user by id
  const user = await UserModel.findById(req.user?._id);

  // if user is not found
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // find video local path
  let videoLocalPath;
  try {
    videoLocalPath = req.files.video?.[0]?.path;
  } catch (error) {
    console.error("Video file is missing", error);
    throw new ApiError(400, "Video file is required");
  }

  // find thumnail local path
  let thumnailLocalPath;
  try {
    thumnailLocalPath = req.files?.thumbnail?.[0]?.path;
  } catch (error) {
    console.error("Thumnail  is missing", error);
    throw new ApiError(400, "Thumnail  is required");
  }

  // upload video to cloudinary
  let video;
  try {
    video = await uploadOnCloudinary(videoLocalPath);

    console.log("Video uploaded to cloudinary", video.secure_url);
  } catch (error) {
    console.error("Error uploading video to cloudinary", error);
    throw new ApiError(
      400,
      "Something went wrong uploading video to cloudinary"
    );
  }

  // upload thumnail image to cloudinary
  let thumbnail;
  try {
    thumbnail = await uploadOnCloudinary(thumnailLocalPath);

    console.log("Thumbnail uploaded to cloudinary", thumbnail.secure_url);
  } catch (error) {
    console.error("Error uploading Thumnail to cloudinary", error);
    throw new ApiError(
      400,
      "Something went wrong uploading Thumnail to cloudinary"
    );
  }

  try {
    // create new video
    const newVideo = new VideoModel({
      title,
      description,
      category,
      userId: req.user?._id,
      videoUrl: video?.secure_url,
      videoId: video?.public_id,
      thumbnailUrl: thumbnail?.secure_url,
      thumnailId: thumbnail?.public_id,
      tags: tags.split(", "),
    });

    // save video to db
    await newVideo.save();

    // return the success response
    return res
      .status(201)
      .json(new ApiResponse(201, newVideo, "Video Added Successfully"));
  } catch (error) {
    console.error("Error adding video", error);
    throw new ApiError(500, "Something went wrong while adding video");
  }
});

const updateVideoDetails = asyncHandler(async (req, res) => {
  // extract video id by params
  const videoId = req.params.id;

  // extract details from request/from body
  const { title, description, category, tags } = req.body;

  // find user by id
  const user = await UserModel.findById(req.user?._id);

  // if user is not found
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // find video by id
  const video = await VideoModel.findById(videoId);

  // if video is not found
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // check if user is the owner of the video
  if (video?.userId.toString() !== user?._id.toString()) {
    throw new ApiError(
      403,
      "Unauthorized - You don't have permission to update this video"
    );
  }

  // find video by id & update
  const updatedVideo = await VideoModel.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        category,
        tags: tags.split(", "),
      },
    },
    {
      new: true,
    }
  );

  // if video is not found
  if (!updatedVideo) {
    throw new ApiError(404, "Video not found");
  }

  // return the success response
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedVideo, "Video detils Updated Successfully")
    );
});

const updateVideoThumbnail = asyncHandler(async (req, res) => {
  // get video id from params
  const videoId = req.params.id;

  // find user by id
  const user = await UserModel.findById(req.user?._id);

  // if user is not found
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // find video by id
  const video = await VideoModel.findById(videoId);

  // if video is not found
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // check if user is the owner of the video
  if (video?.userId.toString() !== user?._id.toString()) {
    throw new ApiError(
      403,
      "Unauthorized - You don't have permission to update thumbnail"
    );
  }

  // find thumbnail local path
  let thumbnailLocalPath;
  try {
    thumbnailLocalPath = req.file?.path;
  } catch (error) {
    console.error("Thumnail  is missing", error);
    throw new ApiError(400, "Thumnail  is required");
  }

  // upload thumnail image to cloudinary
  let thumbnail;
  try {
    thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    // console.log("Thumbnail uploaded to cloudinary", thumbnail?.secure_url);
  } catch (error) {
    console.error("Error uploading Thumnail to cloudinary", error);
    throw new ApiError(
      400,
      "Something went wrong uploading Thumnail to cloudinary"
    );
  }

  // delete old thumbnail from cloudinary
  let deletedThumnail;
  try {
    deletedThumnail = await deleteFromCloudinary(video.thumnailId);
  } catch (error) {
    console.error("Error deleting thumbnail", error);
    throw new ApiError(
      500,
      "Something went wrong while deleting thumbnail",
      deletedThumnail.url
    );
  }

  // find video by id & update
  const updatedVideo = await VideoModel.findByIdAndUpdate(
    videoId,
    {
      $set: {
        thumbnailUrl: thumbnail?.secure_url,
        thumnailId: thumbnail?.public_id,
      },
    },
    {
      new: true,
    }
  );

  // if updated video is not found
  if (!updatedVideo) {
    throw new ApiError(404, "Video not found");
  }

  // return the success response
  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Thumnail Updated Successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  // get video id from params
  const videoId = req.params.id;

  // find user by id
  const user = await UserModel.findById(req.user?._id);

  // if user is not found
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // find video by id
  const video = await VideoModel.findById(videoId);

  // if video is not found
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // check if user is the owner of the video
  if (video?.userId.toString() !== user?._id.toString()) {
    throw new ApiError(
      403,
      "Unauthorized - You don't have permission to delete this video"
    );
  }

  // delete video from cloudinary
  let deletedVideoFromCloudinary;
  try {
    // deletedVideoFromCloudinary = await deleteFromCloudinary(video?.videoId);
    deletedVideoFromCloudinary = await cloudinary.uploader.destroy(
      video?.videoId,
      { resource_type: "video" }
    );

    console.log("Video deleted from cloudinary successfully");
  } catch (error) {
    console.error("Error deleting video", error);
    throw new ApiError(500, "Something went wrong while deleting video");
  }

  // delete thumnail from cloudinary
  let deletedThumnailFromCloudinary;
  try {
    deletedThumnailFromCloudinary = await deleteFromCloudinary(
      video?.thumnailId
    );

    console.log("Thumnail deleted from cloudinary successfully");
  } catch (error) {
    throw new ApiError(500, "Something went wrong while deleting thumnail");
  }

  // find video by id & delete
  const deletedVideo = await VideoModel.findByIdAndDelete(videoId);

  // if deleted video is not found
  if (!deletedVideo) {
    throw new ApiError(404, "Video not found");
  }

  // return the success response
  return res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "Video deleted successfully"));
});

const likeVideo = asyncHandler(async (req, res) => {
  // get video id from params
  const videoId = req.params.id;

  // find user by id
  const user = await UserModel.findById(req.user?._id);

  // if user is not found
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // find video by id
  const video = await VideoModel.findById(videoId);

  // if video is not found
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // if user has already liked the video
  if (video?.likedBy?.includes(user?._id)) {
    throw new ApiError(400, "You have already liked this video");
  }

  // if user has already disliked the video
  let likedVideo;
  if (video?.dislikedBy?.includes(user?._id)) {
    // find video by id & update
    likedVideo = await VideoModel.findByIdAndUpdate(
      videoId,
      {
        $set: {
          dislikes: video?.dislikes - 1,
          likes: video?.likes + 1,
        },
        $pull: {
          dislikedBy: user?._id,
        },
        $push: {
          likedBy: user?._id,
        },
      },
      {
        new: true,
      }
    );
  } else {
    // find video by id & update
    likedVideo = await VideoModel.findByIdAndUpdate(
      videoId,
      {
        $set: {
          likes: video?.likes + 1,
        },
        $push: {
          likedBy: user?._id,
        },
      },
      {
        new: true,
      }
    );
  }

  // if liked video is not found
  if (!likedVideo) {
    throw new ApiError(404, "Video not found");
  }

  // return the success response
  return res
    .status(200)
    .json(new ApiResponse(200, likedVideo, "You've liked the video."));
});

const dislikeVideo = asyncHandler(async (req, res) => {
  // get video id from params
  const videoId = req.params.id;

  // find user by id
  const user = await UserModel.findById(req.user?._id);

  // if user is not found
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // find video by id
  const video = await VideoModel.findById(videoId);

  // if video is not found
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // if user has already disliked the video
  if (video?.dislikedBy?.includes(user?._id)) {
    throw new ApiError(400, "You have already disliked this video");
  }

  // if user has already liked the video
  let dislikedVideo;
  if (video?.likedBy?.includes(user?._id)) {
    // find video by id & update
    dislikedVideo = await VideoModel.findByIdAndUpdate(
      videoId,
      {
        $set: {
          likes: video?.likes - 1,
          dislikes: video?.dislikes + 1,
        },
        $pull: {
          likedBy: user?._id,
        },
        $push: {
          dislikedBy: user?._id,
        },
      },
      { new: true }
    );
  } else {
    // find video by id & update
    dislikedVideo = await VideoModel.findByIdAndUpdate(
      videoId,
      {
        $set: {
          dislikes: video?.dislikes + 1,
        },
        $push: {
          dislikedBy: user?._id,
        },
      },
      { new: true }
    );

    // if disliked video is not found
    if (!dislikedVideo) {
      throw new ApiError(404, "Video not found");
    }
  }

  // return the success response
  return res
    .status(200)
    .json(new ApiResponse(200, dislikedVideo, "You've disliked the video."));
});

const viewVideo = asyncHandler(async(req,res)=> {
  // get video id from params
  const videoId = req.params.id;

  // find user by id
  // const user = await UserModel.findById(req.user?._id);

  // if user is not found
  // if (!user) {
  //   throw new ApiError(404, "User not found");
  // }

  // find video by id
  const video = await VideoModel.findById(videoId);

  // if video is not found
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // find video by id & update
  const updatedVideo = await VideoModel.findByIdAndUpdate(
    videoId,
    {
      $set: {
        views: video.views +1,
      },
    },
    { new: true }
  );

  // if updated video is not found
  if (!updatedVideo) {
    throw new ApiError(404, "Video not found");
  }

  // return the success response
  return res
   .status(200)
   .json(new ApiResponse(200, updatedVideo, "Video viewed successfully"));

});


export {
  addVideo,
  updateVideoDetails,
  updateVideoThumbnail,
  deleteVideo,
  likeVideo,
  dislikeVideo,
  viewVideo
};
