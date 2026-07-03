import { prisma } from "@/lib/prisma";

const DEMO_USER_EMAIL = "confeiteira@delicias.local";

export async function getCurrentUserId() {
  const user = await prisma.user.upsert({
    where: {
      email: DEMO_USER_EMAIL,
    },
    create: {
      nome: "Confeiteira Delícias",
      email: DEMO_USER_EMAIL,
    },
    update: {},
    select: {
      id: true,
    },
  });

  return user.id;
}
