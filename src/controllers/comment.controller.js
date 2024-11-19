import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { UserModel } from "../models/user.models.js";
import { CommentModel } from "../models/comment.models.js";
import { VideoModel } from "../models/video.models.js";

const addComment = asyncHandler(async (req, res) => {
  // extract content from request/from body
  const { content } = req.body;

  // get video id from params
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

  // create new comment
  const newComment = new CommentModel({
    content,
    videoId,
    userId: user?._id,
  });

  // save new comment to db
  await newComment.save({ validateBeforeSave: false });

  // return the success response
  return res
    .status(201)
    .json(new ApiResponse(200, newComment, "Comment added successfully"));
});

const getAllComments = asyncHandler(async (req, res) => {
  // get video id from params
  const videoId = req.params.id;

  // find video by id
  const video = await VideoModel.findById(videoId);

  // if video is not found
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // find comments by video id
  const comments = await CommentModel.find({ videoId }).populate(
    "userId",
    "channelName logoUrl"
  );

  // if comments are not found
  if (!comments) {
    throw new ApiError(404, "Comments not found");
  }

  // return the success response
  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const editComment = asyncHandler(async (req, res) => {
  // extract content from request/from body
  const { content } = req.body;

  // get comment id from params
  const commentId = req.params.id;

  // find comment by id
  const comment = await CommentModel.findById(commentId);

  // if comment is not found
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  // find user by id
  const user = await UserModel.findById(req.user?._id);

  // if user is not found
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // if user is not the owner of the comment
  if (comment?.userId.toString() !== user?._id.toString()) {
    throw new ApiError(
      403,
      "Unauthorized - You don't have permission to update this comment"
    );
  }

  // find comment by id & update comment
  const updatedComment = await CommentModel.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
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
  // get comment id from params
  const commentId = req.params.id;

  // find comment by id
  const comment = await CommentModel.findById(commentId);

  // if comment is not found
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  // find user by id
  const user = await UserModel.findById(req.user?._id);

  // if user is not found
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // if user is not the owner of the comment
  if (comment?.userId.toString() !== user?._id.toString()) {
    throw new ApiError(
      403,
      "Unauthorized - You don't have permission to delete this comment"
    );
  }

  // delete comment from db
  const deletedComment = await CommentModel.findByIdAndDelete(commentId);

  // return the success response
  return res
    .status(200)
    .json(new ApiResponse(200, deletedComment, "Comment deleted successfully"));
});
export { addComment, editComment, deleteComment, getAllComments };
