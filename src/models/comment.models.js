import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    videoId: {
      type: String,
      required: [true, "Video is required"],
    },
  },
  { timestamps: true }
);

export const CommentModel = mongoose.model("Comment", commentSchema);
