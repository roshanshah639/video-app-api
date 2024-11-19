import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { UserModel } from "../models/user.models.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  // get token
  const token =
    req.cookies.accessToken ||
    req.header("Authorization").replace("Bearer ", "");

  // if token is not found
  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    // verify token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // find user by id
    const user = await UserModel.findById(decodedToken?._id);

    // if user is not found
    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    // add user to request object
    req.user = user;

    // call next middleware
    next();
  } catch (error) {
    throw new ApiError(500, error.message || "Failed to verify Access Token");
  }
});
