import mongoose, { Schema } from "mongoose";

const videoSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    userId: {
      type: String,
      required: [true, "User id is required"],
    },
    videoUrl: {
      type: String, // cloudinary url
      required: [true, "Video file is required"],
    },
    videoId: {
      type: String,
      required: [true, "Video id is required"],
    },
    thumbnailUrl: {
      type: String, // cloudinary url
      required: [true, "Thumbnail file is required"],
    },
    thumnailId: {
      type: String,
      required: [true, "Thumbnail id is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
    },
    tags: [
      {
        type: String,
        // required: [true, "Tag is required"],
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

    likedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    dislikedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
    // comments: [
    //   {
    //     type: Schema.Types.ObjectId,
    //     ref: "Comment",
    //   },
    // ],
  },
  { timestamps: true }
);

export const VideoModel = mongoose.model("Video", videoSchema);
