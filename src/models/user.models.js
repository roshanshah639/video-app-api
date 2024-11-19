import mongoose, { Schema } from "mongoose";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    channelName: {
      type: String,
      required: [true, "Channel name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    logoUrl: {
      type: String, // cloudinary url
      required: [true, "Logo is required"],
    },
    logoId: {
      type: String,
      required: [true, "Logo id is required"],
    },
    subscribers: {
      type: Number,
      default: 0,
    },

    subscribedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    subscribedChannels: [
      {
        type: Schema.Types.ObjectId, 
        ref: "User", 
      },
    ],

    unsubscribers: {
      type: Number,
      default: 0,
    },

    unsubscribedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

// hash the password before saving to db
userSchema.pre("save", async function (next) {
  // if password is not modified
  if (!this.isModified("password")) return next();

  // hash the password
  this.password = await bcryptjs.hash(this.password, 10);

  // call to next callback
  next();
});

// check if password is correct
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcryptjs.compare(password, this.password);
};

// generate access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      channelName: this.channelName,
      email: this.email,
      phone: this.phone,
      logoId: this.logoId,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};
// generate refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

export const UserModel = mongoose.model("User", userSchema);
