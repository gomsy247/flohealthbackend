import express from "express";
import { getPosts, addPost, deletePost, addVideoPost, getAllTalentVideoPosts } from "../controllers/post.js";

const router = express.Router();

router.get("/", getPosts);
router.get("/get-all-videos", getAllTalentVideoPosts);
router.post("/", addPost);
router.post("/add-video", addVideoPost);
router.delete("/:id", deletePost);

export default router;
