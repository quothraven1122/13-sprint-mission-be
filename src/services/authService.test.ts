import { jest } from "@jest/globals";
import createError from "../utils/createError.js";
import type { UserRequestType } from "./../types/user.js";

jest.unstable_mockModule("../repositories/authRepository.js", () => ({
  default: {
    create: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
  },
}));

jest.unstable_mockModule("bcrypt", () => ({
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

const { default: authService } = await import("./authService.js");
const { default: authRepository } =
  await import("../repositories/authRepository.js");
const { default: bcrypt } = await import("bcrypt");

const mockedAuthRepository = jest.mocked(authRepository);
const mockedBcrypt = jest.mocked(bcrypt);

describe("권한 관련 테스트", () => {
  const userData = {
    name: "정형준",
    email: "rulludino@gmail.com",
    username: "rulludino",
    password: "test1234!@",
    passwordConfirmation: "test1234!@",
  };

  const createdUserData = {
    id: 12,
    name: "정형준",
    email: "rulludino@gmail.com",
    username: "rulludino",
    deletedAt: null,
    accessToken:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIsIm5hbWUiOiJZdW5hIExlZSIsImVtYWlsIjoiZG1vbkBnbWFpbC5jb20iLCJ1c2VybmFtZSI6ImRtb24iLCJkZWxldGVkQXQiOm51bGwsImlhdCI6MTc4NzcyMzczMCwiZXhwIjoxNzg3NzI3MzMwfQ.XIkmro8JQuIK1WLx_Pz3KS18jBayUNB0AogLXZVJG50",
  };

  const existingUser = {
    id: 12,
    name: "정형준",
    email: "rulludino@gmail.com",
    username: "rulludino",
    password: "$2b$10$hashedPassword",
    deletedAt: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockedAuthRepository.findByEmail.mockResolvedValue(null);
    mockedAuthRepository.findByUsername.mockResolvedValue(null);

    mockedBcrypt.hash.mockResolvedValue("$2b$10$hashedPassword" as never);
    mockedBcrypt.compare.mockResolvedValue(true as never);
  });

  describe("createUser", () => {
    test("필수값이 없으면 유저 생성에 실패한다.", async () => {
      // 1. Arrange
      const { name, email, username, password, passwordConfirmation } =
        userData;

      const testDatas: Partial<typeof userData>[] = [
        { email, username, password, passwordConfirmation },
        { name, username, password, passwordConfirmation },
        { name, email, password, passwordConfirmation },
        { name, email, username, passwordConfirmation },
        { name, email, username, password },
      ];

      // 2. Act & 3. Assert
      for (const data of testDatas) {
        await expect(
          authService.createUser(data as UserRequestType),
        ).rejects.toThrow(
          createError(
            400,
            "name, email, username, password, passwordConfirmation은 필수 값입니다.",
          ),
        );

        expect(mockedAuthRepository.findByEmail).not.toHaveBeenCalled();

        expect(mockedAuthRepository.findByUsername).not.toHaveBeenCalled();

        expect(mockedAuthRepository.create).not.toHaveBeenCalled();

        jest.clearAllMocks();
      }
    });

    test("비밀번호와 비밀번호 확인이 일치하지 않으면 유저 생성에 실패한다.", async () => {
      // 1. Arrange
      const data = {
        ...userData,
        passwordConfirmation: "differentPassword123!",
      };

      // 2. Act & 3. Assert
      await expect(
        authService.createUser(data as UserRequestType),
      ).rejects.toThrow(
        createError(400, "비밀번호와 비밀번호 확인이 일치하지 않습니다."),
      );

      expect(mockedAuthRepository.findByEmail).not.toHaveBeenCalled();

      expect(mockedAuthRepository.findByUsername).not.toHaveBeenCalled();

      expect(mockedAuthRepository.create).not.toHaveBeenCalled();
    });

    test("이미 존재하는 이메일이면 유저 생성에 실패한다.", async () => {
      // 1. Arrange
      mockedAuthRepository.findByEmail.mockResolvedValue(existingUser);

      // 2. Act & 3. Assert
      await expect(
        authService.createUser(userData as UserRequestType),
      ).rejects.toThrow(createError(409, "이미 존재하는 유저입니다."));

      expect(mockedAuthRepository.findByEmail).toHaveBeenCalledWith(
        userData.email,
      );

      expect(mockedAuthRepository.findByUsername).toHaveBeenCalledWith(
        userData.username,
      );

      expect(mockedAuthRepository.create).not.toHaveBeenCalled();
    });

    test("이미 존재하는 username이면 유저 생성에 실패한다.", async () => {
      // 1. Arrange
      mockedAuthRepository.findByEmail.mockResolvedValue(null);
      mockedAuthRepository.findByUsername.mockResolvedValue(existingUser);

      // 2. Act & 3. Assert
      await expect(
        authService.createUser(userData as UserRequestType),
      ).rejects.toThrow(createError(409, "이미 존재하는 유저입니다."));

      expect(mockedAuthRepository.findByEmail).toHaveBeenCalledWith(
        userData.email,
      );

      expect(mockedAuthRepository.findByUsername).toHaveBeenCalledWith(
        userData.username,
      );

      expect(mockedAuthRepository.create).not.toHaveBeenCalled();
    });

    test("존재하지 않는 유저라면 유저를 생성한다.", async () => {
      // 1. Arrange
      mockedAuthRepository.findByEmail.mockResolvedValue(null);
      mockedAuthRepository.findByUsername.mockResolvedValue(null);

      mockedAuthRepository.create.mockResolvedValue(createdUserData as never);

      mockedBcrypt.hash.mockResolvedValue("$2b$10$hashedPassword" as never);

      // 2. Act
      const result = await authService.createUser(userData as UserRequestType);

      // 3. Assert
      expect(mockedAuthRepository.findByEmail).toHaveBeenCalledWith(
        userData.email,
      );

      expect(mockedAuthRepository.findByUsername).toHaveBeenCalledWith(
        userData.username,
      );

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(
        userData.password,
        expect.anything(),
      );

      expect(mockedAuthRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: userData.name,
          email: userData.email,
          username: userData.username,
          password: "$2b$10$hashedPassword",
        }),
      );

      expect(result).toEqual(createdUserData);
    });
  });

  describe("signIn", () => {
    test("username을 통해서 로그인할 수 있다.", async () => {
      // 1. Arrange
      const loginData = {
        id: userData.username,
        password: userData.password,
      };

      mockedAuthRepository.findByEmail.mockResolvedValue(null);
      mockedAuthRepository.findByUsername.mockResolvedValue(existingUser);

      mockedBcrypt.compare.mockResolvedValue(true as never);

      // 2. Act
      const result = await authService.signIn(loginData);

      // 3. Assert
      expect(mockedAuthRepository.findByEmail).toHaveBeenCalledWith(
        loginData.id,
      );

      expect(mockedAuthRepository.findByUsername).toHaveBeenCalledWith(
        loginData.id,
      );

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        loginData.password,
        existingUser.password,
      );

      expect(result).not.toHaveProperty("password");
      expect(result).toEqual(
        expect.objectContaining({
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          username: existingUser.username,
          deletedAt: existingUser.deletedAt,
        }),
      );
    });

    test("email을 통해서 로그인할 수 있다.", async () => {
      // 1. Arrange
      const loginData = {
        id: userData.email,
        password: userData.password,
      };

      mockedAuthRepository.findByEmail.mockResolvedValue(existingUser);

      mockedBcrypt.compare.mockResolvedValue(true as never);

      // 2. Act
      const result = await authService.signIn(loginData);

      // 3. Assert
      expect(mockedAuthRepository.findByEmail).toHaveBeenCalledWith(
        loginData.id,
      );

      expect(mockedAuthRepository.findByUsername).toHaveBeenCalledWith(
        loginData.id,
      );

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        loginData.password,
        existingUser.password,
      );

      expect(result).not.toHaveProperty("password");

      expect(result).toEqual(
        expect.objectContaining({
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          username: existingUser.username,
          deletedAt: existingUser.deletedAt,
        }),
      );
    });

    test("아이디를 잘못 입력하면 로그인이 실패한다.", async () => {
      // 1. Arrange
      const loginData = {
        id: "wrongUser",
        password: userData.password,
      };

      mockedAuthRepository.findByEmail.mockResolvedValue(null);
      mockedAuthRepository.findByUsername.mockResolvedValue(null);

      // 2. Act & 3. Assert
      await expect(authService.signIn(loginData)).rejects.toThrow(
        createError(401, "존재하지 않는 사용자입니다."),
      );

      expect(mockedAuthRepository.findByEmail).toHaveBeenCalledWith(
        loginData.id,
      );

      expect(mockedAuthRepository.findByUsername).toHaveBeenCalledWith(
        loginData.id,
      );

      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    test("비밀번호를 잘못 입력하면 로그인이 실패한다.", async () => {
      // 1. Arrange
      const loginData = {
        id: userData.email,
        password: "wrongPassword123!",
      };

      mockedAuthRepository.findByEmail.mockResolvedValue(existingUser);

      mockedBcrypt.compare.mockResolvedValue(false as never);

      // 2. Act & 3. Assert
      await expect(authService.signIn(loginData)).rejects.toThrow(
        createError(401, "비밀번호가 일치하지 않습니다"),
      );

      expect(mockedAuthRepository.findByEmail).toHaveBeenCalledWith(
        loginData.id,
      );

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        loginData.password,
        existingUser.password,
      );
    });
  });
});
