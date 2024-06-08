import express from "express";
import { getLikes, addLike, deleteLike, checkLike } from "../controllers/like.js";

const router = express.Router()

router.get("/", getLikes)
router.post("/", addLike)
router.post("/check-like", checkLike)
router.delete("/", deleteLike)


export default router
