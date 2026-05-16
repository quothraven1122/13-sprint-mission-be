import prisma from "../prisma/index.js";
import { asyncHandler } from "./asyncHandler.js";

export const getProduct = asyncHandler(async (req, res) => {
  const { page, pageSize, orderBy = "recent", keyword } = req.query;
  const orderField = orderBy === "favorite" ? "favoriteCount" : "createdAt";
  const skip = (Number(page) - 1) * Number(pageSize);
  const where = {};

  //keyword가 있으면 해당 keyword 포함하는 데이터 리턴
  if (keyword) {
    where.OR = [
      { name: { contains: keyword, mode: "insensitive" } },
      { description: { contains: keyword, mode: "insensitive" } },
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
  const [products, totalCount] = await Promise.all([
    prisma.product.findMany(queryOptions),
    prisma.product.count({ where }),
  ]);

  res.status(200).json({ totalCount, list: products });
});

export const postProduct = asyncHandler(async (req, res) => {
  const { tags = [], images = [], ...rest } = req.body;

  const result = await prisma.product.create({
    data: {
      ...rest,
      tags: {
        connectOrCreate: tags.map((tag) => ({
          where: { name: tag },
          create: { name: tag },
        })),
      },
      images: {
        create: images.map((url) => ({
          url,
        })),
      },
    },
    include: {
      tags: true,
      images: true,
    },
  });

  res.status(201).json(result);
});

export const patchProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { tags = [], images = [], ...rest } = req.body;

  const result = await prisma.product.update({
    where: { id: Number(productId) },
    data: {
      tags: {
        connectOrCreate: tags.map((tag) => ({
          where: { name: tag },
          create: { name: tag },
        })),
      },
      images: {
        create: images.map((url) => ({
          url,
        })),
      },
      ...rest,
    },
  });
  res.status(200).json(result);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const result = await prisma.product.delete({
    where: { id: Number(productId) },
  });
  res.status(200).json(result);
});

export const getProductDetail = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const result = await prisma.product.findUnique({
    where: { id: Number(productId) },
  });
  res.status(200).json(result);
});
