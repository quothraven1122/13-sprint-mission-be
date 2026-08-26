import { jest } from "@jest/globals";
import createError from "../utils/createError.js";

jest.unstable_mockModule("../repositories/userRepository.js", () => ({
  default: {
    find: jest.fn(),
  },
}));

const { default: userService } = await import("./userService.js");
const { default: userRepository } =
  await import("../repositories/userRepository.js");

const mockedUserRepository = jest.mocked(userRepository);

describe("유저 관련 테스트", () => {
  const userData = {
    id: 5,
    name: "정형준",
    email: "rulludino@gmail.com",
    username: "rulludino",
    deletedAt: null,
  };
  describe("getUserDetail", () => {
    (test("존재하는 유저를 찾으면 해당 유저를 조회한다.", async () => {
      //1. Arrange
      mockedUserRepository.find.mockResolvedValue(userData);
      //2. Act & 3. Assert
      await expect(userService.getUserDetail(userData.id)).resolves.toBe(
        userData,
      );
    }),
      test("존재하지 않는 유저를 찾으면 해당 유저를 조회한다.", async () => {
        //1. Arrange
        mockedUserRepository.find.mockResolvedValue(null);
        //2. Act & 3. Assert
        await expect(userService.getUserDetail(userData.id)).rejects.toThrow(
          createError(404, "유저를 찾을 수 없습니다."),
        );
      }));
  });
});
