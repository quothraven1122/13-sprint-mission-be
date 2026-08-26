import type { User } from "@prisma/client";
import userRepository from "../repositories/userRepository.js";
import createError from "../utils/createError.js";

async function getUserDetail(userId: User["id"]) {
  const user = await userRepository.find(userId);
  if (!user) throw createError(404, "유저를 찾을 수 없습니다.");

  return user;
}

export default { getUserDetail };
