import Router from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addComment,
  deleteComment,
  editComment,
  getAllComments,
} from "../controllers/comment.controller.js";

// router config
const router = Router();

// add comment
router.route("/add-comment/:id").post(verifyJWT, addComment);
// get all comments
router.route("/get-all-comments/:id").get(getAllComments);
// edit/update comment
router.route("/edit-comments/:id").patch(verifyJWT, editComment);

// delete comment
router.route("/delete-comment/:id").delete(verifyJWT, deleteComment);

export default router;
