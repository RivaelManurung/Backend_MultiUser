const prisma = require("prisma.js"); // Changed to singleton
console.log("PrismaClient:", prisma);

async function test() {
  try {
    const users = await prisma.user.findMany();
    console.log("Users:", users);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();