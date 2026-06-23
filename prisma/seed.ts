import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { BADGE_CATEGORIES, BADGES } from './data/badges.seed';

const prisma = new PrismaClient();

async function seedBadges() {
  // Categories first so badges can reference them by id.
  const categoryIdByCode = new Map<string, string>();
  for (const category of BADGE_CATEGORIES) {
    const row = await prisma.badgeCategory.upsert({
      where: { code: category.code },
      update: {
        nameKey: category.nameKey,
        icon: category.icon,
        color: category.color,
        displayOrder: category.displayOrder,
        isActive: true,
      },
      create: {
        code: category.code,
        nameKey: category.nameKey,
        icon: category.icon,
        color: category.color,
        displayOrder: category.displayOrder,
      },
    });
    categoryIdByCode.set(category.code, row.id);
  }

  for (const b of BADGES) {
    const categoryId = categoryIdByCode.get(b.categoryCode) ?? null;
    const data = {
      categoryId,
      nameKey: b.nameKey,
      descriptionKey: b.descriptionKey,
      icon: b.icon,
      points: b.points,
      requirementType: b.requirementType,
      requirementValue: b.requirementValue,
      requirementUnit: b.requirementUnit,
      isSecret: b.isSecret,
      rarity: b.rarity,
      displayOrder: b.displayOrder,
      isActive: true,
    };
    await prisma.badge.upsert({
      where: { code: b.code },
      update: data,
      create: { code: b.code, ...data },
    });
  }

  console.log(
    `Seeded ${BADGE_CATEGORIES.length} badge categories and ${BADGES.length} badges.`,
  );
}

async function main() {
  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: { name: 'user' },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin' },
  });

  const breeds = [
    'Labrador',
    'Golden Retriever',
    'Berger Allemand',
    'Bulldog',
    'Caniche',
  ];
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
      roleId: userRole.id,
      userStats: { create: {} },
      userPreferences: { create: {} },
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@harmonypaws.app' },
    update: {},
    create: {
      email: 'admin@harmonypaws.app',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      onBoarding: false,
      roleId: adminRole.id,
      userStats: { create: {} },
      userPreferences: { create: {} },
    },
  });

  await seedBadges();
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
