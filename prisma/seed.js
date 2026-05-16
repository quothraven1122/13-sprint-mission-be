import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 기존 데이터 삭제
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  console.log("📝 기존 데이터 삭제 완료");

  //유저 생성
  const user1 = await prisma.user.create({
    data: {
      name: "user1",
      email: "user1@test.com",
      username: "user1",
      password: "1234",
    },
  });
  const user2 = await prisma.user.create({
    data: {
      name: "user2",
      email: "user2@test.com",
      username: "user2",
      password: "1234",
    },
  });

  //상품 생성
  const products = [
    {
      name: "아나의 생체 슈류탄",
      description: "아군 사용시 힐증, 적군 사용시 힐밴",
      price: 52000,
      tags: ["힐러", "개사기"],
      favoriteCount: 2509127,
      userId: user1.id,
    },
    {
      name: "키리코의 방울",
      description: "폭힐 및 무적기",
      price: 50000,
      tags: ["힐러", "개사기"],
      favoriteCount: 3219856,
      userId: user1.id,
    },
    {
      name: "토르비욘의 망치",
      description: "꼬마 망치 나가신다",
      price: 9200,
      tags: ["딜러", "보조무기", "포탑깡깡", "망치살인마", "싸이코"],
      favoriteCount: 18,
      userId: user1.id,
    },
    {
      name: "메이의 설구",
      description: "주변을 얼리는 똑똑한 보조 로봇",
      price: 9200,
      tags: ["딜러", "개쓰레기궁", "제발열려줘", "싸이코"],
      favoriteCount: 287,
      userId: user1.id,
    },
    {
      name: "정커퀸의 그레이시",
      description: "부메랑처럼 돌아오는 신기한 칼",
      price: 15000,
      tags: ["탱커", "땡기기"],
      favoriteCount: 124,
      userId: user2.id,
    },
    {
      name: "우양의 물",
      description: "게이지 이제 없어",
      price: 52000,
      tags: ["힐러", "물부족", "게이지", "다개피"],
      favoriteCount: 2509127,
      userId: user2.id,
    },
    {
      name: "바스티온의 포격",
      description: "쀼쀼쀼 쀼 쀼 쀼쀼쀼 쀼 쀼",
      price: 52000,
      tags: ["딜러", "쾅쾅쾅", "제발맞아"],
      favoriteCount: 2642,
      userId: user2.id,
    },
    {
      name: "솜브라의 바이러스",
      description: "거의 반피를 깎는 투사체 스킬",
      price: 99999999,
      tags: ["딜러", "개사기"],
      favoriteCount: 2345678,
      userId: user2.id,
    },
    {
      name: "주노의 하이퍼링",
      description: "지나가면 빨라지는 화성의 링",
      price: 48000,
      tags: ["힐러", "이속", "화성에", "이런일이"],
      favoriteCount: 2509127,
      userId: user2.id,
    },
    {
      name: "브리기테의 방패",
      description: "작은 방패 나가신다",
      price: 52000,
      tags: ["힐러", "힐탱", "든든"],
      favoriteCount: 2509127,
      userId: user2.id,
    },
    {
      name: "루시우의 볼륨업",
      description: "이속시 이속증가, 힐할시 힐 증가",
      price: 52000,
      tags: ["힐러"],
      favoriteCount: 13,
      userId: user2.id,
    },
    {
      name: "루시우의 비트",
      description: "오우 제대로 놀아보자~~!!!",
      price: 98621,
      tags: ["힐러", "개사기", "뻥튀기"],
      favoriteCount: 16557,
      userId: user2.id,
    },
    {
      name: "아나의 생체 슈류탄",
      description: "아군 사용시 힐증, 적군 사용시 힐밴",
      price: 52000,
      tags: ["힐러", "개사기"],
      favoriteCount: 2509127,
      userId: user1.id,
    },
    {
      name: "메르시의 카데세우스 지팡이",
      description: "힐을 해드릴까요 공버프를 해드릴까요",
      price: 23000,
      tags: ["힐러", "노랑", "파랑", "번쩍번쩍"],
      favoriteCount: 159,
      userId: user1.id,
    },
    {
      name: "라마트라의 탐식의 소용돌이",
      description: "공중 적 요격, 적의 이속 감소",
      price: 19000,
      tags: ["탱커", "너프"],
      favoriteCount: 138,
      userId: user1.id,
    },
  ];
  await Promise.all(
    products.map((product) =>
      prisma.product.create({
        data: {
          ...product,
          tags: {
            connectOrCreate: product.tags.map((tag) => ({
              where: { name: tag },
              create: { name: tag },
            })),
          },
        },
      }),
    ),
  );
  console.log(`${products.length}개 상품 생성`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
