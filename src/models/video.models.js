import mongoose, { Schema } from "mongoose";

const videoSchema = new Schema(
  {
    // _id: {
    //   type: mongoose.Schema.Types.ObjectId,
    // },
    title: {
      type: String,
      required: [true, "Title is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    user_id: {
      type: String,
      required: [true, "User ID is required"],
    },
    videoUrl: {
      type: String, // cloudinary url
      required: [true, "Video URL is required"],
    },
    videoId: {
      type: String,
      required: [true, "Video ID is required"],
    },
    thumbnailUrl: {
      type: String, // cloudinary url
      required: [true, "Thumbnail URL is required"],
    },
    thumbnailId: {
      type: String,
      required: [true, "Thumbnail ID is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
    },
    tags: [
      {
        type: String,
      },
    ],
    likes: {
      type: Number,
      default: 0,
    },
    dislikes: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    dislikedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export const VideoModel = mongoose.model("Video", videoSchema);
