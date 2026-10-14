import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

async function createDummyImage(
  filename: string,
  width: number,
  height: number,
  bgColor: string,
  label: string
): Promise<string> {
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "submissions");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const svg = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#grad)" />
    <circle cx="${width / 2}" cy="${height / 2 - 40}" r="${height / 4}" fill="rgba(255,255,255,0.08)" />
    <text x="50%" y="45%" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="64" font-weight="bold">${label}</text>
    <text x="50%" y="55%" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-family="Arial, sans-serif" font-size="28">${width}x${height} • Fotowettbewerb 2026</text>
  </svg>
  `;

  const destPath = path.join(uploadsDir, filename);
  await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile(destPath);
  return `/uploads/submissions/${filename}`;
}

async function main() {
  const contest2 = await prisma.contest.findUnique({
    where: { slug: "architektur-geometrie-2026" },
    include: { topics: true },
  });
  if (!contest2) return;

  const user1 = await prisma.user.findUnique({ where: { email: "clara.fotografin@fotowettbewerb.local" } });
  const user2 = await prisma.user.findUnique({ where: { email: "david.fokus@fotowettbewerb.local" } });
  const juror1 = await prisma.user.findUnique({ where: { email: "juror.anna@fotowettbewerb.local" } });

  if (!user1 || !user2 || !juror1) return;

  const topic1 = contest2.topics[0];
  const topic2 = contest2.topics[1];

  // Image 1: Clara in Topic 1
  const img1Path = await createDummyImage("clara-glasfassade.jpg", 2400, 1600, "#0284c7", "Spiegelung am Elbphilharmonie-Turm");
  const sub1 = await prisma.submission.create({
    data: {
      contestId: contest2.id,
      topicId: topic1.id,
      userId: user1.id,
      title: "Spiegelung am Elbphilharmonie-Turm",
      description: "Frühmorgendliche Linienführung und Spiegelung im Glas.",
      originalFilename: "Elbe_Reflektion.jpg",
      storedFilename: "clara-glasfassade.jpg",
      filePath: img1Path,
      mimeType: "image/jpeg",
      fileSize: 420000,
      width: 2400,
      height: 1600,
      aspectRatio: "3:2",
      cameraModel: "Sony Alpha 7 IV",
      lens: "FE 24-70mm F2.8 GM",
      focalLength: "35mm",
      iso: 100,
      aperture: "f/8.0",
      shutterSpeed: "1/250s",
      takenAt: new Date(),
    },
  });

  // Image 2: David in Topic 2
  const img2Path = await createDummyImage("david-treppenhaus.jpg", 1920, 1280, "#475569", "Gewendelte Geometrie");
  const sub2 = await prisma.submission.create({
    data: {
      contestId: contest2.id,
      topicId: topic2.id,
      userId: user2.id,
      title: "Gewendelte Geometrie",
      description: "Blick von oben in ein denkmalgeschütztes Treppenauge.",
      originalFilename: "Spiral_Stairs.jpg",
      storedFilename: "david-treppenhaus.jpg",
      filePath: img2Path,
      mimeType: "image/jpeg",
      fileSize: 510000,
      width: 1920,
      height: 1280,
      aspectRatio: "3:2",
      cameraModel: "Canon EOS R5",
      lens: "RF 15-35mm F2.8L IS USM",
      focalLength: "16mm",
      iso: 400,
      aperture: "f/5.6",
      shutterSpeed: "1/60s",
      takenAt: new Date(),
    },
  });

  // Add a rating from Juror 1 on sub1 so we have partial rating data
  await prisma.rating.create({
    data: {
      submissionId: sub1.id,
      jurorId: juror1.id,
      score: 9.0,
      comment: "Hervorragende Schärfe und wunderbare Lichtstimmung in den Kanten!",
    },
  });

  console.log("Sample submissions and rating created!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
