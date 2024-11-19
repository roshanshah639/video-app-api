import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { UserModel } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    // find user by id
    const user = await UserModel.findById(userId);

    // if user is not found
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // generate access & refresh tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // add refresh token to database
    user.refreshToken = refreshToken;

    // save user
    await user.save({ validateBeforeSave: false });

    // return the access & refresh tokens
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating Access & Refresh Tokens"
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
  const existigUser = await UserModel.findOne({ email });

  // if user already exists
  if (existigUser) {
    throw new ApiError(400, "User already exists with this email");
  }

  // check for logo local path
  let logoLocalPath;
  try {
    logoLocalPath = req.file?.path;
  } catch (error) {
    throw new ApiError(400, "Logo is missing");
  }

  // upload logo to cloudinary
  let logo;
  try {
    logo = await uploadOnCloudinary(logoLocalPath);
  } catch (error) {
    throw new ApiError(400, "Failed to upload logo to cloudinary");
  }

  try {
    // create new user
    const newUser = await UserModel.create({
      channelName,
      email,
      phone,
      password,
      logoUrl: logo?.secure_url,
      logoId: logo?.public_id,
    });

    // find new user by id & remove password & refresh token
    const createdUser = await UserModel.findById(newUser?._id).select(
      "-password -refreshToken"
    );

    // if user is not created
    if (!createdUser) {
      throw new ApiError(400, "Failed to create user");
    }

    // return the success response
    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          createdUser,
          "User Registered Successfully. Please Login"
        )
      );
  } catch (error) {
    console.error("Error registering User", error);
    throw new ApiError(500, "Something went wrong while registering user");
  }
});

const loginUser = asyncHandler(async (req, res) => {
  // extract details from frontend/request
  const { email, password } = req.body;

  // validations - fields are not empty
  if ([email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // find user by email
  const user = await UserModel.findOne({ email });

  // if user is not found
  if (!user) {
    throw new ApiError(404, "User not found with this email");
  }

  // check if password is correct
  const isPasswordValid = await user.isPasswordCorrect(password);

  // if password is not correct
  if (!isPasswordValid) {
    throw new ApiError(
      400,
      "Password is incorrect. Please enter correct password & try again"
    );
  }

  // generate access & refresh tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user?._id
  );

  // find loggedIn user & remove password, refresh token
  const loggedInUser = await UserModel.findById(user?._id).select(
    "-password -refreshToken"
  );

  // cookies options
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

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
        "User Logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // find user by id & remove refresh token
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
  ).select("-password -refreshToken");

  // cookies options
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  // return the success response
  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User Logged Out Successfully"));
});

const subscribeChannel = asyncHandler(async (req, res) => {
  // find user by id
  const user = await UserModel.findById(req.user?._id);

  // if user is not found
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // find channel id by params
  const channelId = req.params.id;

  // find channel by id
  const channel = await UserModel.findById(channelId);

  // if channel is not found
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  // if user is already subscribed to the channel
  if (channel?.subscribedBy?.includes(user?._id)) {
    throw new ApiError(400, "You are already subscribed to this channel");
  }

  // if user is the owner of the channel - optional
  if (channel?._id.toString() === user?._id.toString()) {
    throw new ApiError(
      403,
      "Unauthorized - You don't have permission to subscribe to your own channel"
    );
  }

  let subscribedChannel;
  // if user have already unsubscribed to the channel
  if (channel?.unsubscribedBy?.includes(user?._id)) {
    subscribedChannel = await UserModel.findByIdAndUpdate(
      channelId,
      {
        $set: {
          unsubscribers: channel?.unsubscribers - 1,
          subscribers: channel?.subscribers + 1,
        },
        $pull: {
          unsubscribedBy: user?._id,
        },
        $push:{
          subscribedBy: user?._id,
        }
      },
      {
        new: true,
      }
    );
  } else {
    // find channel by id & update
    subscribedChannel = await UserModel.findByIdAndUpdate(
      channelId,
      {
        $set: {
          subscribers: channel?.subscribers + 1,
        },
        $push: {
          subscribedBy: user?._id,
        },
      },
      {
        new: true,
      }
    );
  }

  // if subscribed channel is not found
  if (!subscribedChannel) {
    throw new ApiError(404, "Channel not found");
  }

  // find user by id & update
  const updatedUser = await UserModel.findByIdAndUpdate(
    req.user?._id,
    {
      $push: {
        subscribedChannels: subscribedChannel?._id,
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
        subscribedChannel,
        "You've subscribed to this channel successfully"
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

  // find channel id by params
  const channelId = req.params.id;

  // find channel by id
  const channel = await UserModel.findById(channelId);

  // if channel is not found
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

    // if user is the owner of the channel - optional
    if (channel?._id.toString() === user?._id.toString()) {
      throw new ApiError(
        403,
        "Unauthorized - You don't have permission to unsubscribe to your own channel"
      );
    }

  // if user has not subscribed to the channel
  if (!channel?.subscribedBy?.includes(user?._id)) {
    throw new ApiError(400, "You have not subscribed to this channel");
  }

  // find channel by id & update
  const unsubscribedChannel = await UserModel.findByIdAndUpdate(
    channelId,
    {
      $set: {
        subscribers: channel?.subscribers - 1,
        unsubscribers: channel?.unsubscribers + 1,
      },
      $pull:{
        subscribedBy: user?._id,
      },
      $push: {
        unsubscribedBy: user?._id,
      }
    },
    {
      new: true,
    }
  )

  // if channel is not found
  if (!unsubscribedChannel) {
    throw new ApiError(404, "Channel not found");
  }

  // find user by id & update
  const updatedUser = await UserModel.findByIdAndUpdate(
    req.user?._id,
    {
      $pull: {
        subscribedChannels: channelId,
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
      unsubscribedChannel,
      "You've unsubscribed from this channel successfully"
    )
  )

});

export {
  registerUser,
  loginUser,
  logoutUser,
  subscribeChannel,
  unsubscribeChannel,
};
