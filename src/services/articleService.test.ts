import { jest } from "@jest/globals";
import type { User } from "@prisma/client";
import { ArticleReturnType } from "./../types/article.js";
import { CommentReturnType } from "./../types/comment.js";

jest.unstable_mockModule("../repositories/articleRepository.js", () => ({
  default: {
    create: jest.fn(),
    findAll: jest.fn(),
    countByKeyword: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn(),
    findCommentsByArticleId: jest.fn(),
    findLike: jest.fn(),
    like: jest.fn(),
    unlike: jest.fn(),
  },
}));

const { default: articleService } = await import("./articleService.js");
const { default: articleRepository } =
  await import("../repositories/articleRepository.js");

const mockArticleRepository = jest.mocked(articleRepository);

describe("게시글 관련 테스트", () => {
  const mockUser: Omit<User, "password"> = {
    id: 2,
    name: "테스트 유저",
    email: "test@test.com",
    username: "testuser",
    deletedAt: null,
  };

  const mockArticle: ArticleReturnType = {
    id: 1,
    title: "테스트 게시글",
    content: "테스트 콘텐트",
    favoriteCount: 0,
    image: "image/url.jpg",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 2,
    user: mockUser,
  };

  const mockComment: CommentReturnType = {
    id: 1,
    content: "테스트 댓글",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 2,
    articleId: 1,
    user: mockUser,
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("createArticle", () => {
    test("게시글을 생성한다", async () => {
      // 1. Arrange
      const input = {
        title: "테스트 게시글",
        content: "테스트 콘텐트",
        image: "image/url.jpg",
        userId: 2,
      };

      mockArticleRepository.create.mockResolvedValue(mockArticle);

      // 2. Act
      const result = await articleService.createArticle(input);

      // 3. Assert
      expect(mockArticleRepository.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockArticle);
    });

    test("title이 없으면 400 에러가 발생한다", async () => {
      // 1. Arrange
      const input = {
        title: "",
        content: "테스트 콘텐트",
        image: "image/url.jpg",
        userId: 2,
      };

      // 2. Act & 3. Assert
      await expect(articleService.createArticle(input)).rejects.toMatchObject({
        status: 400,
        message: "title과 content는 필수 값입니다.",
      });

      expect(mockArticleRepository.create).not.toHaveBeenCalled();
    });

    test("content가 없으면 400 에러가 발생한다", async () => {
      // 1. Arrange
      const input = {
        title: "테스트 게시글",
        content: "",
        image: "image/url.jpg",
        userId: 2,
      };

      // 2. Act & 3. Assert
      await expect(articleService.createArticle(input)).rejects.toMatchObject({
        status: 400,
        message: "title과 content는 필수 값입니다.",
      });

      expect(mockArticleRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("getArticles", () => {
    test("게시글 목록과 전체 개수를 조회한다", async () => {
      // 1. Arrange
      const articles = [
        {
          ...mockArticle,
          liked: false,
        },
      ];

      mockArticleRepository.findAll.mockResolvedValue(articles);
      mockArticleRepository.countByKeyword.mockResolvedValue(1);

      const input = {
        page: 1,
        pageSize: 10,
        orderBy: "createdAt" as const,
        keyword: "테스트",
        userId: 2,
      };

      // 2. Act
      const result = await articleService.getArticles(input);

      // 3. Assert
      expect(mockArticleRepository.findAll).toHaveBeenCalledWith(input);
      expect(mockArticleRepository.countByKeyword).toHaveBeenCalledWith(
        "테스트",
      );
      expect(result).toEqual({
        totalCount: 1,
        list: articles,
      });
    });

    test("page가 1보다 작으면 400 에러가 발생한다", async () => {
      // 1. Arrange
      const input = {
        page: 0,
        pageSize: 10,
        orderBy: "createdAt" as const,
      };

      // 2. Act & 3. Assert
      await expect(articleService.getArticles(input)).rejects.toMatchObject({
        status: 400,
        message: "page는 1 이상이어야 합니다.",
      });

      expect(mockArticleRepository.findAll).not.toHaveBeenCalled();
      expect(mockArticleRepository.countByKeyword).not.toHaveBeenCalled();
    });

    test("pageSize가 1보다 작으면 400 에러가 발생한다", async () => {
      // 1. Arrange
      const input = {
        page: 1,
        pageSize: 0,
        orderBy: "createdAt" as const,
      };

      // 2. Act & 3. Assert
      await expect(articleService.getArticles(input)).rejects.toMatchObject({
        status: 400,
        message: "pageSize는 1 이상이어야 합니다.",
      });

      expect(mockArticleRepository.findAll).not.toHaveBeenCalled();
      expect(mockArticleRepository.countByKeyword).not.toHaveBeenCalled();
    });

    test("잘못된 정렬 기준이면 400 에러가 발생한다", async () => {
      // 타입을 벗어난 값을 일부러 넣어 validation을 테스트
      const input = {
        page: 1,
        pageSize: 10,
        orderBy: "invalid" as "createdAt",
      };

      // 2. Act & 3. Assert
      await expect(articleService.getArticles(input)).rejects.toMatchObject({
        status: 400,
        message: "잘못된 정렬 기준입니다.",
      });

      expect(mockArticleRepository.findAll).not.toHaveBeenCalled();
      expect(mockArticleRepository.countByKeyword).not.toHaveBeenCalled();
    });
  });

  describe("getArticleDetail", () => {
    test("게시글 상세 정보와 댓글을 조회한다", async () => {
      // 1. Arrange
      mockArticleRepository.findById.mockResolvedValue({
        ...mockArticle,
        liked: false,
      });
      mockArticleRepository.findCommentsByArticleId.mockResolvedValue([
        mockComment,
      ]);

      // 2. Act
      const result = await articleService.getArticleDetail(1, 2);

      // 3. Assert
      expect(mockArticleRepository.findById).toHaveBeenCalledWith(1, 2);
      expect(
        mockArticleRepository.findCommentsByArticleId,
      ).toHaveBeenCalledWith(1);

      expect(result).toEqual({
        ...mockArticle,
        comments: [mockComment],
        liked: false,
      });
    });

    test("게시글이 존재하지 않으면 404 에러가 발생한다", async () => {
      // 1. Arrange
      mockArticleRepository.findById.mockResolvedValue(null);

      // 2. Act & 3. Assert
      await expect(
        articleService.getArticleDetail(999, 2),
      ).rejects.toMatchObject({
        status: 404,
        message: "게시글을 찾을 수 없습니다.",
      });

      expect(
        mockArticleRepository.findCommentsByArticleId,
      ).not.toHaveBeenCalled();
    });
  });

  describe("updateArticle", () => {
    test("게시글을 수정한다", async () => {
      // 1. Arrange
      const input = {
        title: "수정된 제목",
        content: "수정된 내용",
        userId: 2,
      };

      const updatedArticle = {
        ...mockArticle,
        title: "수정된 제목",
        content: "수정된 내용",
      };

      mockArticleRepository.findById.mockResolvedValue({
        ...mockArticle,
        liked: false,
      });
      mockArticleRepository.update.mockResolvedValue(updatedArticle);

      // 2. Act
      const result = await articleService.updateArticle(1, input);

      // 3. Assert
      expect(mockArticleRepository.findById).toHaveBeenCalledWith(1);
      expect(mockArticleRepository.update).toHaveBeenCalledWith(1, input);
      expect(result).toEqual(updatedArticle);
    });

    test("게시글이 존재하지 않으면 404 에러가 발생한다", async () => {
      // 1. Arrange
      mockArticleRepository.findById.mockResolvedValue(null);

      // 2. Act & 3. Assert
      await expect(
        articleService.updateArticle(999, {
          title: "수정된 제목",
        }),
      ).rejects.toMatchObject({
        status: 404,
        message: "게시글을 찾을 수 없습니다.",
      });

      expect(mockArticleRepository.update).not.toHaveBeenCalled();
    });

    test("수정할 값이 없으면 400 에러가 발생한다", async () => {
      // 1. Arrange
      mockArticleRepository.findById.mockResolvedValue({
        ...mockArticle,
        liked: false,
      });

      // 2. Act & 3. Assert
      await expect(articleService.updateArticle(1, {})).rejects.toMatchObject({
        status: 400,
        message: "수정할 값을 하나 이상 입력해야 합니다.",
      });

      expect(mockArticleRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("deleteArticle", () => {
    test("게시글을 삭제한다", async () => {
      // 1. Arrange
      mockArticleRepository.findById.mockResolvedValue({
        ...mockArticle,
        liked: false,
      });
      mockArticleRepository.deleteById.mockResolvedValue(mockArticle);

      // 2. Act
      const result = await articleService.deleteArticle(1);

      // 3. Assert
      expect(mockArticleRepository.findById).toHaveBeenCalledWith(1);
      expect(mockArticleRepository.deleteById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockArticle);
    });

    test("게시글이 존재하지 않으면 404 에러가 발생한다", async () => {
      // 1. Arrange
      mockArticleRepository.findById.mockResolvedValue(null);

      // 2. Act & 3. Assert
      await expect(articleService.deleteArticle(999)).rejects.toMatchObject({
        status: 404,
        message: "게시글을 찾을 수 없습니다.",
      });

      expect(mockArticleRepository.deleteById).not.toHaveBeenCalled();
    });
  });

  describe("likeArticle", () => {
    test("좋아요가 없으면 좋아요를 추가한다", async () => {
      // 1. Arrange
      mockArticleRepository.findById.mockResolvedValue({
        ...mockArticle,
        liked: true,
      });
      mockArticleRepository.findLike.mockResolvedValue(null);

      const likedArticle = {
        ...mockArticle,
        favoriteCount: 1,
      };

      mockArticleRepository.like.mockResolvedValue(likedArticle);

      // 2. Act
      const result = await articleService.likeArticle(1, 2);

      // 3. Assert
      expect(mockArticleRepository.findById).toHaveBeenCalledWith(1);
      expect(mockArticleRepository.findLike).toHaveBeenCalledWith(1, 2);
      expect(mockArticleRepository.like).toHaveBeenCalledWith(1, 2);

      expect(result).toEqual({
        liked: true,
        favoriteCount: 1,
      });
    });

    test("이미 좋아요를 눌렀다면 좋아요를 추가하지 않는다", async () => {
      // 1. Arrange
      const existedLike = {
        id: 1,
        createdAt: new Date(),
        userId: 2,
        articleId: 1,
      };

      mockArticleRepository.findById.mockResolvedValue({
        ...mockArticle,
        favoriteCount: 5,
        liked: true,
      });

      mockArticleRepository.findLike.mockResolvedValue(existedLike);

      // 2. Act
      const result = await articleService.likeArticle(1, 2);

      // 3. Assert
      expect(mockArticleRepository.findById).toHaveBeenCalledWith(1);
      expect(mockArticleRepository.findLike).toHaveBeenCalledWith(1, 2);
      expect(mockArticleRepository.like).not.toHaveBeenCalled();

      expect(result).toEqual({
        liked: true,
        favoriteCount: 5,
      });
    });
  });

  describe("unlikeArticle", () => {
    test("좋아요가 있으면 좋아요를 취소한다", async () => {
      // 1. Arrange
      const existedLike = {
        id: 1,
        createdAt: new Date(),
        userId: 2,
        articleId: 1,
      };

      mockArticleRepository.findById.mockResolvedValue({
        ...mockArticle,
        liked: false,
      });
      mockArticleRepository.findLike.mockResolvedValue(existedLike);

      const unlikedArticle = {
        ...mockArticle,
        favoriteCount: 4,
      };

      mockArticleRepository.unlike.mockResolvedValue(unlikedArticle);

      // 2. Act
      const result = await articleService.unlikeArticle(1, 2);

      // 3. Assert
      expect(mockArticleRepository.findById).toHaveBeenCalledWith(1);
      expect(mockArticleRepository.findLike).toHaveBeenCalledWith(1, 2);
      expect(mockArticleRepository.unlike).toHaveBeenCalledWith(1, 2);

      expect(result).toEqual({
        liked: false,
        favoriteCount: 4,
      });
    });

    test("좋아요가 없으면 좋아요를 취소하지 않는다", async () => {
      // 1. Arrange
      mockArticleRepository.findById.mockResolvedValue({
        ...mockArticle,
        favoriteCount: 3,
        liked: false,
      });

      mockArticleRepository.findLike.mockResolvedValue(null);

      // 2. Act
      const result = await articleService.unlikeArticle(1, 2);

      // 3. Assert
      expect(mockArticleRepository.findById).toHaveBeenCalledWith(1);
      expect(mockArticleRepository.findLike).toHaveBeenCalledWith(1, 2);
      expect(mockArticleRepository.unlike).not.toHaveBeenCalled();

      expect(result).toEqual({
        liked: false,
        favoriteCount: 3,
      });
    });
  });
});
