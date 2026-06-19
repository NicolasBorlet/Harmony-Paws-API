import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: { name: 'user' },
  });

  const breeds = ['Labrador', 'Golden Retriever', 'Berger Allemand', 'Bulldog', 'Caniche'];
  for (const name of breeds) {
    await prisma.breed.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const behaviors = ['Sociable', 'Joueur', 'Calme', 'Énergique', 'Protecteur'];
  for (const name of behaviors) {
    await prisma.behavior.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const passwordHash = await bcrypt.hash('password123', 10);
  await prisma.user.upsert({
    where: { email: 'demo@harmonypaws.app' },
    update: {},
    create: {
      email: 'demo@harmonypaws.app',
      passwordHash,
      firstName: 'Demo',
      lastName: 'User',
      onBoarding: false,
      roleId: 1,
      userStats: { create: {} },
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
