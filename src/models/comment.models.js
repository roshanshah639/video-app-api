import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    videoId: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const CommentModel = mongoose.model("Comment", commentSchema);
