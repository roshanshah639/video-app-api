import Router from "express";
import {
  addVideo,
  deleteVideo,
  dislikeVideo,
  likeVideo,
  updateVideoDetails,
  updateVideoThumnail,
  viewVideo,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

// router config
const router = Router();

// add video route
router.route("/add-video").post(
  verifyJWT,
  upload.fields([
    {
      name: "video",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  addVideo
);

// update video route
router.route("/update-video-details/:id").patch(verifyJWT, updateVideoDetails);

// update video thumbnail route
router
  .route("/update-video-thumbnail/:id")
  .patch(verifyJWT, upload.single("thumbnail"), updateVideoThumnail);

// delete video
router.route("/delete-video/:id").delete(verifyJWT, deleteVideo);

// like a video
router.route("/like-video/:id").put(verifyJWT, likeVideo);
// dislike a video
router.route("/dislike-video/:id").put(verifyJWT, dislikeVideo);
// view video
router.route("/view-video/:id").put(viewVideo);

export default router;
