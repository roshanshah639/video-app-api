import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { UserModel } from "../models/user.models.js";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    // find user by user id
    const user = await UserModel.findById(userId);

    // if user is not found
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // generate access and refresh tokens
    const accessToken = user.generateAccessToken();
    // generate refresh token
    const refreshToken = user.generateRefreshToken();

    // save refresh token to user
    user.refreshToken = refreshToken;

    // save updated user
    await user.save({ validateBeforeSave: false });

    // return access & refresh tokens
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // extract details from frontend/request
  const { channelName, email, phone, password } = req.body;

  // validations - fields are not empty
  if (
    [channelName, email, phone, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // find user by email
  const existingUser = await UserModel.findOne({ email });

  // if user already exists
  if (existingUser) {
    throw new ApiError(
      400,
      "User already exists with this email. Please use another email or Loign with existing credentials"
    );
  }

  // check for logo local file path
  let logoImageLocalPath;
  try {
    logoImageLocalPath = req.file?.path;
  } catch (error) {
    throw new ApiError(400, "Logo is required. Logo is missing");
  }

  // upload logo to cloudinary
  let logo;
  try {
    logo = await uploadOnCloudinary(logoImageLocalPath);
  } catch (error) {
    throw new ApiError(
      400,
      "Something went wrong while uploading logo to cloudinary. Please try again"
    );
  }

  try {
    // create new user
    const newUser = await UserModel.create({
      // _id: new mongoose.Types.ObjectId,
      channelName,
      email,
      phone,
      password,
      logoUrl: logo?.secure_url || null,
      logoId: logo?.public_id || null,
    });

    // find created user & remove password & refresh token
    const createdUser = await UserModel.findById(newUser?._id).select(
      "-password -refreshToken"
    );

    // return the success response
    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          createdUser,
          "User registered successfully.Please Login"
        )
      );
  } catch (error) {
    throw new ApiError(
      400,
      "Something went wrong while registering user. Please try again"
    );
  }
});

const loginUser = asyncHandler(async (req, res) => {
  // extract details from frontend/request
  const { email, password } = req.body;

  // validations - fields are not empty
  if (!email && !password) {
    throw new ApiError(400, "Email & Password are required");
  }

  // find user by email
  const user = await UserModel.findOne({ email });

  // if user is not found
  if (!user) {
    throw new ApiError(400, "User not found with this email. Please Register");
  }

  // check if password is correct
  const isPasswordValid = await user.isPasswordCorrect(password);

  // if password is not correct
  if (!isPasswordValid) {
    throw new ApiError(400, "Password is incorrect. Please try again");
  }

  // generate access & refresh tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user?._id
  );

  // cookies options
  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  // find logged In user and remove password, refresh token
  const loggedInUser = await UserModel.findById(user?._id).select(
    "-password -refreshToken"
  );

  // return the success response
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },

        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // find user by id & unset refresh token
  await UserModel.findByIdAndUpdate(
    req.user?._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  // cookies options
  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  // return the success response
  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const subscribeChannel = asyncHandler(async (req, res) => {
  // find user by id
  const user = await UserModel.findById(req.user?._id);

  // if user is not found
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // extract user id from request/params
  const channelId = req.params.id;

  // find channel by id
  const channel = await UserModel.findById(channelId);

  // if channel is not found
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  // check if user is already subscribed to the channel
  if (channel?.subscribedBy?.includes(req.user?._id)) {
    throw new ApiError(400, "You have already subscribed to this channel");
  }

  // find channel by id & update
  const updatedChannel = await UserModel.findByIdAndUpdate(
    channelId,
    {
      $push: { subscribedBy: user?._id },
      $set: {
        subscribers: channel?.subscribers + 1,
      },
    },
    {
      new: true,
    }
  );

  // if channel is not updated
  if (!updatedChannel) {
    throw new ApiError(500, "Something went wrong. Please try again");
  }

  // find usr by id & update
  const updatedUser = await UserModel.findByIdAndUpdate(
    req.user?._id,
    {
      $push: { subscribedChannels: channelId },
    },
    {
      new: true,
    }
  );

  /// if user is not updated
  if (!updatedUser) {
    throw new ApiError(500, "Something went wrong. Please try again");
  }

  // return the success response
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedChannel,
        "You have subscribed to the channel successfully"
      )
    );
});
const unsubscribeChannel = asyncHandler(async (req, res) => {
  // find user by id
  const user = await UserModel.findById(req.user?._id);

  // if user is not found
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // extract user id from request/params
  const channelId = req.params.id;

  // find channel by id
  const channel = await UserModel.findById(channelId);

  // if channel is not found
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  // check if user has not subscribed to the channel
  if (!channel?.subscribedBy?.includes(req.user?._id)) {
    throw new ApiError(400, "You have not subscribed to this channel yet.");
  }

  // check if user is already unsubscribed to the channel
  if (channel?.unsubscribedBy?.includes(req.user?._id)) {
    throw new ApiError(400, "You have already unsubscribed to this channel");
  }

  // find channel by id & update
  const updatedChannel = await UserModel.findByIdAndUpdate(
    channelId,
    {
      $push: { unsubscribedBy: user?._id },
      $set: {
        unsubsribers: channel?.unsubsribers + 1,
      },
    },
    {
      new: true,
    }
  );

  // if channel is not updated
  if (!updatedChannel) {
    throw new ApiError(500, "Something went wrong. Please try again");
  }

  // find user by id & update
  const updatedUser = await UserModel.findByIdAndUpdate(
    req.user?._id,
    {
      $pull: {
        subscribedChannels: channelId,
        subscribedBy: user?._id,
      },

      $set: {
        subscribers: channel?.subscribers - 1,
      },
    },
    {
      new: true,
    }
  );

  // return the success response
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedChannel,
        "You have unsubscribed to the channel successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  subscribeChannel,
  unsubscribeChannel,
};
