import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { UserModel } from "../models/user.models.js";
import { VideoModel } from "../models/video.models.js";
import { v2 as cloudinary } from "cloudinary";

const addVideo = asyncHandler(async (req, res) => {
  // // extract details from request/frontend
  const { title, description, category, tags } = req.body;

  // // validations - fields are not empty
  if (
    [title, description, category, tags].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // find user by id
  const user = await UserModel.findById(req.user?._id);

  // is user is not found
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // check for video local path
  let videoLocalPath;
  try {
    videoLocalPath = req.files?.video?.[0]?.path;
  } catch (error) {
    throw new ApiError(
      500,
      "Video file is required. Please upload a video file"
    );
  }

  // check for thumbnail local path
  let thumbnailLocalPath;
  try {
    thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
  } catch (error) {
    throw new ApiError(
      500,
      "thumbnail file is required. Please upload a thumbnail file"
    );
  }

  // upload video to cloudinary
  let video;
  try {
    video = await uploadOnCloudinary(videoLocalPath);
  } catch (error) {
    throw new ApiError(500, "Failed to upload video to cloudinary");
  }

  // upload thumbnail to cloudinary
  let thumbnail;
  try {
    thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  } catch (error) {
    throw new ApiError(500, "Failed to upload thumbnail to cloudinary");
  }

  // create new video
  const newVideo = new VideoModel({
    title,
    description,
    user_id: user?._id,
    videoUrl: video?.secure_url || "",
    videoId: video?.public_id,
    thumbnailUrl: thumbnail?.secure_url,
    thumbnailId: thumbnail?.public_id,
    category,
    tags: tags.split(","),
  });

  // save user
  await newVideo.save({ validateBeforeSave: false });

  // return success response
  return res
    .status(201)
    .json(new ApiResponse(201, newVideo, "Video uploaded successfully"));
});

const updateVideoDetails = asyncHandler(async (req, res) => {
  // extract video id from request/params
  const videoId = req.params.id;

  // extract details from request/frontend
  const { title, description, category, tags } = req.body;

  // validations
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

  // find video by id
  const updatedVideo = await VideoModel.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        category,
        tags: tags.split(","),
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

  // save updated video
  await updatedVideo.save({ validateBeforeSave: false });

  // return success response
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedVideo, "Video details updated successfully")
    );
});

const updateVideoThumnail = asyncHandler(async (req, res) => {
  // extract video id from request/params
  const videoId = req.params.id;

  // find user by id
  const user = await UserModel.findById(req.user?._id);

  // if user is not found
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // find video by id
  const video = await VideoModel.findById(videoId);

  // check for thumbnail local path
  let thumnailLocalPath;
  try {
    thumnailLocalPath = req.file?.path;
  } catch (error) {
    throw new ApiError(
      500,
      "thumbnail file is required. Please upload a thumbnail file"
    );
  }

  // upload thumbnail to cloudinary
  let thumbnail;
  try {
    thumbnail = await uploadOnCloudinary(thumnailLocalPath);
  } catch (error) {
    throw new ApiError(500, "Failed to upload thumbnail to cloudinary");
  }

  // delete old thumbnail
  cloudinary.uploader.destroy(video?.thumbnailId);

  // find video by id update thumbnail
  const updatedVideo = await VideoModel.findByIdAndUpdate(
    videoId,
    {
      $set: {
        thumbnailUrl: thumbnail?.secure_url,
        thumbnailId: thumbnail?.public_id,
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

  // save updated video
  await updatedVideo.save({ validateBeforeSave: false });

  // return success response
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedVideo, "Video thumbnail updated successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  // extract video id from parameters
  const videoId = req.params.id;

  // find video by id
  const video = await VideoModel.findById(videoId);

  // if video is not found
  if (!video) {
    throw new ApiError(404, "Video not found to delete");
  }

  // find user by id
  const user = await UserModel.findById(req.user?._id);

  // if user is not found
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // delete video from cloudinary
  cloudinary.uploader.destroy(video?.videoId, {
    resource_type: "video",
  });

  // delete thumbnail from cloudinary
  cloudinary.uploader.destroy(video?.thumbnailId);

  // delete video
  const deletedVideo = await VideoModel.findByIdAndDelete(videoId);

  // return success response
  return res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "Video deleted successfully"));
});

const likeVideo = asyncHandler(async (req, res) => {
  // extract video id from parameters
  const videoId = req.params.id;

  // find video by id
  const video = await VideoModel.findById(videoId);

  // if video is not found
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // find user by id
  const user = await UserModel.findById(req.user?._id);

  // if user is not found
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // check if user has already liked the video
  if (video?.likedBy?.includes(user?._id)) {
    throw new ApiError(
      400,
      "You have already liked this video. Try liking other videos"
    );
  }

  // if user has alread disliked video
  if (video?.dislikedBy?.includes(user?._id)) {
    await VideoModel.findByIdAndUpdate(
      videoId,
      {
        $pull: { dislikedBy: user?._id },
        $set: {
          dislikes: video?.dislikes - 1,
        },
      },
      {
        new: true,
      }
    );
  }

  // find video by id & update it
  const likedVideo = await VideoModel.findByIdAndUpdate(
    videoId,
    {
      $push: { likedBy: user?._id },
      $set: {
        likes: video?.likes + 1,
      },
    },
    {
      new: true,
    }
  );

  // if video is not found
  if (!likedVideo) {
    throw new ApiError(404, "Video not found to like");
  }

  // return the sucess response
  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideo, "You have liked the Video successfully")
    );
});

const dislikeVideo = asyncHandler(async (req, res) => {
  // extract video id from parameters
  const videoId = req.params.id;

  // find video by id
  const video = await VideoModel.findById(videoId);

  // if video is not found
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // find user by id
  const user = await UserModel.findById(req.user?._id);

  // if user is not found
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // check if user has already liked the video
  if (video?.dislikedBy?.includes(user?._id)) {
    throw new ApiError(400, "You have already disliked this video.");
  }

  // if user has already liked video
  if (video?.likedBy?.includes(user?._id)) {
    await VideoModel.findByIdAndUpdate(
      videoId,
      {
        $pull: { likedBy: user?._id },
        $set: {
          likes: video?.likes - 1,
        },
      },
      {
        new: true,
      }
    );
  }

  // find video by id & update it
  const dislikedVideo = await VideoModel.findByIdAndUpdate(
    videoId,
    {
      $push: { dislikedBy: user?._id },
      $set: {
        dislikes: video?.dislikes + 1,
      },
    },
    {
      new: true,
    }
  );

  // if video is not found
  if (!dislikedVideo) {
    throw new ApiError(404, "Video not found to dislike");
  }

  // return the sucess response
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        dislikedVideo,
        "You have disliked the Video successfully"
      )
    );
});

const viewVideo = asyncHandler(async (req, res) => {
  // extract video id from parameters
  const videoId = req.params.id;

  // find video by id
  const video = await VideoModel.findById(videoId);

  // if video is not found
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // update video views
  const updatedVideo = await VideoModel.findByIdAndUpdate(
    videoId,
    {
      $set: {
        views: video?.views + 1,
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
      new ApiResponse(
        200,
        updatedVideo,
        "You have viewed the Video successfully"
      )
    );
});

export {
  addVideo,
  updateVideoDetails,
  updateVideoThumnail,
  deleteVideo,
  likeVideo,
  dislikeVideo,
  viewVideo,
};
