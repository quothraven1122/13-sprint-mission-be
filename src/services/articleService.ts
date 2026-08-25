import articleRepository from "../repositories/articleRepository.js";
import createError from "../utils/createError.js";
import type { User, Article } from "@prisma/client";
import type {
  ArticleFindAllRequestType,
  ArticlePostRequestType,
  ArticlePatchRequestType,
  ArticleReturnType,
} from "../types/article.js";
import type { CommentReturnType } from "../types/comment.js";

const VALID_ORDER_BY = ["createdAt", "favoriteCount"];

const createArticle = async (
  data: ArticlePostRequestType & { userId: User["id"] },
): Promise<ArticleReturnType> => {
  const { title, content } = data;

  if (!title || !content)
    throw createError(400, "title과 content는 필수 값입니다.");

  return articleRepository.create(data);
};

const getArticles = async ({
  page,
  pageSize,
  orderBy,
  keyword,
  userId,
}: ArticleFindAllRequestType): Promise<{
  totalCount: number;
  list: (ArticleReturnType & { liked: boolean })[];
}> => {
  if (page !== undefined && page < 1)
    throw createError(400, "page는 1 이상이어야 합니다.");
  if (pageSize !== undefined && pageSize < 1)
    throw createError(400, "pageSize는 1 이상이어야 합니다.");
  if (orderBy && !VALID_ORDER_BY.includes(orderBy))
    throw createError(400, "잘못된 정렬 기준입니다.");

  const [articles, totalCount] = await Promise.all([
    articleRepository.findAll({ page, pageSize, orderBy, keyword, userId }),
    articleRepository.countByKeyword(keyword),
  ]);

  return {
    totalCount,
    list: articles,
  };
};

const getArticleDetail = async (
  articleId: Article["id"],
  userId?: User["id"],
): Promise<ArticleReturnType & { comments: CommentReturnType[] }> => {
  const article = await articleRepository.findById(articleId, userId);
  if (!article) throw createError(404, "게시글을 찾을 수 없습니다.");

  const comments = await articleRepository.findCommentsByArticleId(articleId);

  return {
    ...article,
    comments,
  };
};

const updateArticle = async (
  articleId: Article["id"],
  data: ArticlePatchRequestType,
): Promise<ArticleReturnType> => {
  const { title, content } = data;
  const article = await articleRepository.findById(articleId);
  if (!article) throw createError(404, "게시글을 찾을 수 없습니다.");
  if (!title && !content)
    throw createError(400, "수정할 값을 하나 이상 입력해야 합니다.");

  return articleRepository.update(articleId, data);
};

const deleteArticle = async (
  articleId: Article["id"],
): Promise<ArticleReturnType> => {
  const article = await articleRepository.findById(articleId);
  if (!article) throw createError(404, "게시글을 찾을 수 없습니다.");

  const deletedArticle = await articleRepository.deleteById(articleId);
  return deletedArticle;
};

const likeArticle = async (
  articleId: Article["id"],
  userId: User["id"],
): Promise<{ liked: true; favoriteCount: number }> => {
  const existedLike = await articleRepository.findLike(articleId, userId);
  const article = await articleRepository.findById(articleId);
  if (!article) {
    throw createError(404, "게시글을 찾을 수 없습니다.");
  }

  if (existedLike) {
    return {
      liked: true,
      favoriteCount: article.favoriteCount,
    };
  }

  const result = await articleRepository.like(articleId, userId);

  return {
    liked: true,
    favoriteCount: result.favoriteCount,
  };
};

const unlikeArticle = async (
  articleId: Article["id"],
  userId: User["id"],
): Promise<{ liked: false; favoriteCount: number }> => {
  const existedLike = await articleRepository.findLike(articleId, userId);
  const article = await articleRepository.findById(articleId);
  if (!article) {
    throw createError(404, "게시글을 찾을 수 없습니다.");
  }

  if (!existedLike) {
    return {
      liked: false,
      favoriteCount: article.favoriteCount,
    };
  }

  const result = await articleRepository.unlike(articleId, userId);

  return {
    liked: false,
    favoriteCount: result.favoriteCount,
  };
};

export default {
  createArticle,
  getArticles,
  getArticleDetail,
  updateArticle,
  deleteArticle,
  likeArticle,
  unlikeArticle,
};
