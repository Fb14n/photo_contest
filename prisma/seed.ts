import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean old entries
  await prisma.rating.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.contestParticipant.deleteMany();
  await prisma.contestJuror.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.contest.deleteMany();
  await prisma.user.deleteMany();

  const adminPass = await bcrypt.hash("Admin123!", 10);
  const userPass = await bcrypt.hash("User123!", 10);
  const juryPass = await bcrypt.hash("Jury123!", 10);

  // 1. Users
  const admin = await prisma.user.create({
    data: {
      email: "admin@fotowettbewerb.local",
      name: "Haupt-Administrator",
      passwordHash: adminPass,
      role: "ADMIN",
    },
  });

  const juror1 = await prisma.user.create({
    data: {
      email: "juror.anna@fotowettbewerb.local",
      name: "Anna Schmidt (Jury)",
      passwordHash: juryPass,
      role: "JUROR",
    },
  });

  const juror2 = await prisma.user.create({
    data: {
      email: "juror.bernd@fotowettbewerb.local",
      name: "Bernd Weber (Jury)",
      passwordHash: juryPass,
      role: "JUROR",
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: "clara.fotografin@fotowettbewerb.local",
      name: "Clara Licht",
      passwordHash: userPass,
      role: "PARTICIPANT",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "david.fokus@fotowettbewerb.local",
      name: "David Fokus",
      passwordHash: userPass,
      role: "PARTICIPANT",
    },
  });

  // 2. Contest 1: Einreichungsphase aktiv (Herbst & Natur)
  const now = new Date();
  const subStart = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const subEnd = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
  const rateStart = new Date(subEnd);
  const rateEnd = new Date(subEnd.getTime() + 7 * 24 * 60 * 60 * 1000);

  const contest1 = await prisma.contest.create({
    data: {
      title: "Herbst- & Naturfotografie 2026",
      slug: "herbst-natur-2026",
      description:
        "Der jährliche Fotowettbewerb rund um die bunte Jahreszeit, mystische Nebelwälder und verborgene Makrowelten.",
      status: "SUBMISSION",
      accessType: "OPEN",
      submissionStart: subStart,
      submissionEnd: subEnd,
      ratingStart: rateStart,
      ratingEnd: rateEnd,
      votingMode: "EXCLUSIVE_JURY",
      anonymousJudging: true,
      maxFileSizeMb: 15.0,
      allowedFormats: "image/jpeg,image/png,image/webp",
      minWidth: 1200,
      minHeight: 800,
      aspectRatio: "free",
      topics: {
        create: [
          {
            title: "Faszinierende Makrowelt",
            description: "Details von Tautropfen, Pilzen, Insekten und Blattadern",
            maxSubmissionsPerUser: 2,
            orderIndex: 0,
          },
          {
            title: "Wilde Tierwelt",
            description: "Einheimische Tiere in ihrem natürlichen Lebensraum",
            maxSubmissionsPerUser: 2,
            orderIndex: 1,
          },
          {
            title: "Herbstliche Landschaften",
            description: "Goldene Wälder, Bergpanoramen und Morgendunst",
            maxSubmissionsPerUser: 2,
            orderIndex: 2,
          },
        ],
      },
    },
    include: { topics: true },
  });

  // Add Jurors to contest1
  await prisma.contestJuror.create({
    data: {
      contestId: contest1.id,
      userId: juror1.id,
      email: juror1.email,
      name: juror1.name,
      status: "ACTIVE",
    },
  });

  await prisma.contestJuror.create({
    data: {
      contestId: contest1.id,
      userId: juror2.id,
      email: juror2.email,
      name: juror2.name,
      status: "ACTIVE",
    },
  });

  // 3. Contest 2: Jurierungsphase aktiv (Architektur & Linien)
  const c2SubStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const c2SubEnd = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // ended yesterday!
  const c2RateStart = c2SubEnd;
  const c2RateEnd = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days left to judge

  const contest2 = await prisma.contest.create({
    data: {
      title: "Architektur, Licht & Geometrie 2026",
      slug: "architektur-geometrie-2026",
      description:
        "Klare Formen, moderne Fassaden und historische Bauwerke. Die Einreichung ist beendet, jetzt läuft die Jury-Bewertung!",
      status: "RATING",
      accessType: "INVITE_ONLY",
      maxParticipants: 50,
      submissionStart: c2SubStart,
      submissionEnd: c2SubEnd,
      ratingStart: c2RateStart,
      ratingEnd: c2RateEnd,
      votingMode: "EXCLUSIVE_JURY",
      anonymousJudging: true,
      maxFileSizeMb: 20.0,
      allowedFormats: "image/jpeg,image/png,image/webp",
      minWidth: 1920,
      minHeight: 1080,
      aspectRatio: "free",
      topics: {
        create: [
          {
            title: "Moderne Glas- & Stahlfassaden",
            description: "Spiegelungen und futuristische Konstruktionen",
            maxSubmissionsPerUser: 1,
            orderIndex: 0,
          },
          {
            title: "Historische Gewölbe & Treppenhäuser",
            description: "Symmetrien und alte Baukunst",
            maxSubmissionsPerUser: 1,
            orderIndex: 1,
          },
        ],
      },
    },
    include: { topics: true },
  });

  // Jurors for contest 2
  await prisma.contestJuror.create({
    data: {
      contestId: contest2.id,
      userId: juror1.id,
      email: juror1.email,
      name: juror1.name,
      status: "ACTIVE",
    },
  });
  await prisma.contestJuror.create({
    data: {
      contestId: contest2.id,
      userId: juror2.id,
      email: juror2.email,
      name: juror2.name,
      status: "ACTIVE",
    },
  });

  // Sample participants for contest 2
  await prisma.contestParticipant.create({
    data: {
      contestId: contest2.id,
      userId: user1.id,
      email: user1.email,
      name: user1.name,
      status: "REGISTERED",
    },
  });

  await prisma.contestParticipant.create({
    data: {
      contestId: contest2.id,
      userId: user2.id,
      email: user2.email,
      name: user2.name,
      status: "REGISTERED",
    },
  });

  // Also an invited participant waiting for signup
  await prisma.contestParticipant.create({
    data: {
      contestId: contest2.id,
      email: "neuer.gast@fotowettbewerb.local",
      name: "Gast Fotograf",
      inviteToken: "invite-gast-12345",
      status: "INVITED",
    },
  });

  console.log("Seeding finished successfully!");
  console.log("Admin: admin@fotowettbewerb.local / Admin123!");
  console.log("Juror 1: juror.anna@fotowettbewerb.local / Jury123!");
  console.log("Juror 2: juror.bernd@fotowettbewerb.local / Jury123!");
  console.log("User: clara.fotografin@fotowettbewerb.local / User123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
