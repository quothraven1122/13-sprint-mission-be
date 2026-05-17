import express from "express";
import {
  postComment,
  getComment,
  patchComment,
  deleteComment,
} from "../controllers/index.js";

const commentRouter = express.Router({
  mergeParams: true,
});
commentRouter.post("/", postComment);
commentRouter.get("/", getComment);
commentRouter.patch("/:commentId", patchComment);
commentRouter.delete("/:commentId", deleteComment);

export default commentRouter;
