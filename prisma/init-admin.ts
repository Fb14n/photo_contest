import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@fotowettbewerb.local";
  const existing = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!existing) {
    const password = process.env.INITIAL_ADMIN_PASSWORD || "ChangeMe123!";
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Administrator",
        role: "ADMIN",
        passwordHash,
      },
    });
    console.log(`[Init] Initialer Administrator angelegt: ${user.email} (Passwort: ${password})`);
  } else {
    console.log(`[Init] Administrator existiert bereits: ${existing.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
