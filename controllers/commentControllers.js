import prisma from "../prisma/index.js";
import { asyncHandler } from "./asyncHandler.js";

export const postComment = asyncHandler(async (req, res) => {
  const { articleId } = req.params;
  const result = await prisma.comment.create({
    data: {
      articleId: Number(articleId),
      ...req.body,
    },
  });
  return res.status(201).json(result);
});

export const getComment = asyncHandler(async (req, res) => {
  const { articleId } = req.params;
  const { cursor } = req.query;
  const result = await prisma.comment.findMany({
    take: 10,
    cursor: cursor ? { id: Number(cursor) } : undefined,
    skip: cursor ? 1 : 0,
    orderBy: {
      id: "asc",
    },
    where: { articleId: Number(articleId) },
  });
  return res.status(200).json(result);
});

export const patchComment = asyncHandler(async (req, res) => {
  const { articleId, commentId } = req.params;
  const result = await prisma.comment.update({
    where: { id: Number(commentId) },
    data: {
      articleId: Number(articleId),
      ...req.body,
    },
  });
  return res.status(200).json(result);
});

export const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const result = await prisma.comment.delete({
    where: { id: Number(commentId) },
  });
  return res.status(200).json(result);
});
