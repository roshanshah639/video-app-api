import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addComment,
  deleteComment,
  editComment,
  getAllComments,
} from "../controllers/comment.controller.js";

// router config
const router = Router();

// add comment route
router.route("/add-comment/:id").post(verifyJWT, addComment);

// get all comments route
router.route("/get-all-comments/:id").get(getAllComments);

// edit comment route
router.route("/edit-comments/:id").patch(verifyJWT, editComment);

// delete comment route
router.route("/delete-comment/:id").delete(verifyJWT, deleteComment);

export default router;
