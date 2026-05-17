import prisma from "../prisma/index.js";
import { asyncHandler } from "./asyncHandler.js";

export const postArticle = asyncHandler(async (req, res) => {
  const result = await prisma.article.create({
    data: req.body,
  });
  res.status(201).json(result);
});

export const getArticle = asyncHandler(async (req, res) => {
  const { page, pageSize, orderBy = "recent", keyword } = req.query;
  const orderField = "createdAt";
  const skip = (Number(page) - 1) * Number(pageSize);
  const where = {};

  if (keyword) {
    where.OR = [
      { title: { contains: keyword, mode: "insensitive" } },
      { content: { contains: keyword, mode: "insensitive" } },
    ];
  }

  //데이터 조회, page와 pageSize 둘 다 있을 때만 pagination 적용
  const queryOptions = {
    where,
    orderBy: { [orderField]: "desc" },
  };
  if (page && pageSize) {
    queryOptions.skip = (Number(page) - 1) * Number(pageSize);
    queryOptions.take = Number(pageSize);
  }

  const [articles, totalCount] = await Promise.all([
    prisma.article.findMany(queryOptions),
    prisma.article.count({ where }),
  ]);

  res.status(200).json({ totalCount, list: articles });
});

export const getArticleDetail = asyncHandler(async (req, res) => {
  const { articleId } = req.params;
  const result = await prisma.article.findUnique({
    where: { id: Number(articleId) },
  });
  return res.status(200).json(result);
});

export const patchArticle = asyncHandler(async (req, res) => {
  const { articleId } = req.params;
  const result = await prisma.article.update({
    where: { id: Number(articleId) },
    data: req.body,
  });
  res.status(200).json(result);
});

export const deleteArticle = asyncHandler(async (req, res) => {
  const { articleId } = req.params;
  const result = await prisma.article.delete({
    where: { id: Number(articleId) },
  });
  res.status(200).json(result);
});
