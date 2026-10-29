import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export async function GET(
  req: Request,
  props: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await props.params;

    if (!segments || segments.length === 0) {
      return new NextResponse("Invalid Path", { status: 400 });
    }

    // Prevent directory traversal
    for (const segment of segments) {
      if (segment === ".." || segment.includes("\\") || segment.includes("/")) {
        return new NextResponse("Invalid Path", { status: 400 });
      }
    }

    const relativePath = path.join(...segments);

    // Candidate locations for uploaded files
    const candidatePaths = [
      path.join(process.cwd(), "public", "uploads", relativePath),
      path.join("/app/data/uploads", relativePath),
      path.join(process.cwd(), "data", "uploads", relativePath),
    ];

    let filePath: string | null = null;
    for (const cand of candidatePaths) {
      if (fs.existsSync(/*turbopackIgnore: true*/ cand) && fs.statSync(/*turbopackIgnore: true*/ cand).isFile()) {
        filePath = cand;
        break;
      }
    }

    if (!filePath) {
      return new NextResponse("File Not Found", { status: 404 });
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const fileBuffer = fs.readFileSync(/*turbopackIgnore: true*/ filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error serving upload:", error);
    return new NextResponse("Error serving file", { status: 500 });
  }
}
