import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  subscribeChannel,
  unsubscribeChannel,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

// router config
const router = Router();

// register  route
router.route("/register").post(upload.single("logo"), registerUser);
// login route
router.route("/login").post(loginUser);

// secure routes
// logout
router.route("/logout").post(verifyJWT, logoutUser);

// subscribe channel route
router.route("/subscribe/:id").put(verifyJWT, subscribeChannel);
// unsubscribe channel route
router.route("/unsubscribe/:id").put(verifyJWT, unsubscribeChannel);

export default router;
