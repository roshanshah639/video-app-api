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

// register user route
router.route("/register").post(upload.single("logo"), registerUser);
// login user route
router.route("/login").post(loginUser);

// secure routes
router.route("/logout").post(verifyJWT, logoutUser);

// subscribe channel routes
router.route("/subscribe/:id").put(verifyJWT, subscribeChannel);
// unsubscribe channel routes
router.route("/unsubscribe/:id").put(verifyJWT, unsubscribeChannel);

export default router;
