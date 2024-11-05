import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { CommentModel } from "../models/comment.models.js";
import { UserModel } from "../models/user.models.js";
import { VideoModel } from "../models/video.models.js";

const addComment = asyncHandler(async (req, res) => {
  // extract details from request/frontend
  const { content } = req.body;

  // extract video id from request/params
  const videoId = req.params.id;

  // find user
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

  // create a new comment
  const newComment = new CommentModel({
    content,
    userId: user?._id,
    videoId: video?._id,
  });

  // save comment
  await newComment.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, newComment, "Comment added successfully"));
});

const getAllComments = asyncHandler(async (req, res) => {
  // extract video id from request/params
  const videoId = req.params.id;

  // find video by id
  const video = await VideoModel.findById(videoId);

  // if video is not found
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // find all comments
  const comments = await CommentModel.find({ videoId: video?._id }).populate(
    "userId",
    "channelName logoUrl"
  );

  // return the success response
  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const editComment = asyncHandler(async (req, res) => {
  // extract details from request/frontend
  const { content } = req.body;

  // find user by id
  const user = await UserModel.findById(req.user?._id);

  // if user is not found
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // extract comment id from request/params
  const commentId = req.params.id;

  // find comment by id
  const comment = await CommentModel.findById(commentId);

  // if comment is not found
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  // check if comment belongs to user
  if (comment?.userId?.toString() !== req.user?._id?.toString()) {
    throw new ApiError(403, "You are not authorized to edit this comment");
  }

  // find comment by id & update
  const updatedComment = await CommentModel.findByIdAndUpdate(
    commentId,
    {
      $set: { content },
    },
    { new: true }
  );

  // if comment is not found
  if (!updatedComment) {
    throw new ApiError(404, "Comment not found");
  }

  // return the success response
  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // find user by id
  const user = await UserModel.findById(req.user?._id);

  // if user is not found
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // extract comment id from request/params
  const commentId = req.params.id;

  // find comment by id
  const comment = await CommentModel.findById(commentId);

  // if comment is not found
  if (!comment) {
    throw new ApiError(404, "Comment not found to delete");
  }

  // check if comment belongs to user
  if (comment?.userId?.toString() !== req.user?._id?.toString()) {
    throw new ApiError(403, "You are not authorized to delete this comment");
  }

  // find comment by id & update
  const deletedComment = await CommentModel.findByIdAndDelete(commentId);

  // if comment is not found
  if (!deletedComment) {
    throw new ApiError(404, "Comment not found");
  }

  // return the success response
  return res
    .status(200)
    .json(new ApiResponse(200, deletedComment, "Comment deleted successfully"));
});

export { addComment, getAllComments, editComment, deleteComment };
