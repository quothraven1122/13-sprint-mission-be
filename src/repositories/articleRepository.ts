import prisma from "../config/prisma.js";
import type { Prisma, Article, ArticleLike, User } from "@prisma/client";
import type {
  ArticleFindAllRequestType,
  ArticlePostRequestType,
  ArticlePatchRequestType,
  ArticleReturnType,
} from "../types/article.js";
import type { CommentReturnType } from "../types/comment.js";

async function create(
  article: ArticlePostRequestType & { userId: number },
): Promise<ArticleReturnType> {
  const createdArticle = await prisma.article.create({
    data: article,
    include: {
      user: {
        omit: {
          password: true,
        },
      },
    },
  });
  return createdArticle;
}

async function findAll({
  page,
  pageSize,
  orderBy = "createdAt",
  keyword,
  userId,
}: ArticleFindAllRequestType): Promise<
  (ArticleReturnType & { liked: boolean })[]
> {
  const skip = (Number(page) - 1) * Number(pageSize);
  const where: Prisma.ArticleWhereInput = {};

  if (keyword) {
    where.OR = [
      { title: { contains: keyword } },
      { content: { contains: keyword } },
    ];
  }

  const queryOptions = {
    where,
    orderBy: { [orderBy]: "desc" },
    include: {
      user: {
        omit: {
          password: true,
        },
      },
      articleLikes: {
        where: userId ? { userId } : { userId: -1 },
        select: {
          id: true,
        },
      },
    },
    ...(page && pageSize
      ? {
          skip,
          take: pageSize,
        }
      : {}),
  } satisfies Prisma.ArticleFindManyArgs;

  const articles = await prisma.article.findMany(queryOptions);

  const mappedArticles = articles.map(({ articleLikes, ...rest }) => ({
    ...rest,
    liked: !!articleLikes.length,
  }));

  return mappedArticles;
}

async function countByKeyword(keyword?: string): Promise<number> {
  const where: Prisma.ArticleWhereInput = {};
  if (keyword) {
    where.OR = [
      { title: { contains: keyword } },
      { content: { contains: keyword } },
    ];
  }
  if (keyword) {
    where.OR = [
      { title: { contains: keyword } },
      { content: { contains: keyword } },
    ];
  }
  const count = await prisma.article.count({ where });
  return count;
}

async function findById(
  articleId: Article["id"],
  userId?: User["id"],
): Promise<(ArticleReturnType & { liked: boolean }) | null> {
  const article = await prisma.article.findUnique({
    where: { id: Number(articleId) },
    include: {
      user: {
        omit: {
          password: true,
        },
      },
      articleLikes: {
        where: {
          userId: Number(userId ?? -1),
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!article) {
    throw new Error("Article not found");
  }
  const { articleLikes, ...rest } = article;
  return { ...rest, liked: !!articleLikes.length };
}

async function update(
  articleId: Article["id"],
  update: ArticlePatchRequestType,
): Promise<ArticleReturnType> {
  const updatedArticle = await prisma.article.update({
    where: { id: Number(articleId) },
    data: update,
    include: {
      user: {
        omit: {
          password: true,
        },
      },
    },
  });
  return updatedArticle;
}

async function deleteById(
  articleId: Article["id"],
): Promise<ArticleReturnType> {
  const deletedArticle = await prisma.article.delete({
    where: { id: Number(articleId) },
    include: {
      user: {
        omit: {
          password: true,
        },
      },
    },
  });
  return deletedArticle;
}

async function findCommentsByArticleId(
  articleId: Article["id"],
): Promise<CommentReturnType[]> {
  const comments = await prisma.comment.findMany({
    where: { articleId: Number(articleId) },
    include: {
      user: {
        omit: {
          password: true,
        },
      },
    },
  });
  return comments;
}

async function findLike(
  articleId: Article["id"],
  userId: User["id"],
): Promise<ArticleLike | null> {
  const like = await prisma.articleLike.findUnique({
    where: {
      userId_articleId: {
        userId: Number(userId),
        articleId: Number(articleId),
      },
    },
  });

  return like;
}

async function like(articleId: Article["id"], userId: User["id"]) {
  const likeUpdatedArticle = await prisma.$transaction(async (tx) => {
    await tx.articleLike.create({
      data: {
        articleId: Number(articleId),
        userId: Number(userId),
      },
    });

    const updatedArticle = await tx.article.update({
      where: { id: Number(articleId) },
      data: {
        favoriteCount: {
          increment: 1,
        },
      },
    });

    return updatedArticle;
  });
  return likeUpdatedArticle;
}

async function unlike(articleId: Article["id"], userId: User["id"]) {
  const likeUpdatedArticle = await prisma.$transaction(async (tx) => {
    await tx.articleLike.delete({
      where: {
        userId_articleId: {
          articleId: Number(articleId),
          userId: Number(userId),
        },
      },
    });

    const updatedArticle = await tx.article.update({
      where: { id: Number(articleId) },
      data: {
        favoriteCount: {
          decrement: 1,
        },
      },
    });

    return updatedArticle;
  });
  return likeUpdatedArticle;
}

export default {
  create,
  findAll,
  countByKeyword,
  findById,
  update,
  deleteById,
  findCommentsByArticleId,
  findLike,
  like,
  unlike,
};
