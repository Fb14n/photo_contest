import sharp from "sharp";

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  fileSize: number;
  aspectRatio: string;
  colorSpace?: string;
  cameraModel?: string;
  lens?: string;
  focalLength?: string;
  iso?: number;
  aperture?: string;
  shutterSpeed?: string;
  takenAt?: Date;
}

export interface RuleValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ContestRules {
  maxFileSizeMb: number;
  allowedFormats: string;
  minWidth?: number | null;
  minHeight?: number | null;
  maxWidth?: number | null;
  maxHeight?: number | null;
  aspectRatio?: string | null;
  namingPattern?: string | null;
}

export function detectAspectRatio(width: number, height: number): string {
  if (!width || !height) return "unknown";
  const ratio = width / height;

  const ratios: [number, string][] = [
    [1.0, "1:1"],
    [3 / 2, "3:2"],
    [2 / 3, "2:3"],
    [4 / 3, "4:3"],
    [3 / 4, "3:4"],
    [16 / 9, "16:9"],
    [9 / 16, "9:16"],
    [16 / 10, "16:10"],
    [21 / 9, "21:9"],
  ];

  for (const [targetRatio, label] of ratios) {
    if (Math.abs(ratio - targetRatio) < 0.05) {
      return label;
    }
  }

  return `${width}:${height}`;
}

export async function inspectImageBuffer(
  buffer: Buffer,
  fileSize: number
): Promise<ImageMetadata> {
  const metadata = await sharp(buffer).metadata();

  const width = metadata.width || 0;
  const height = metadata.height || 0;
  const format = (metadata.format || "unknown").toLowerCase();
  const aspectRatio = detectAspectRatio(width, height);
  const colorSpace = metadata.space || "unknown";

  // Extract EXIF data if present
  let cameraModel: string | undefined;
  let lens: string | undefined;
  let focalLength: string | undefined;
  let iso: number | undefined;
  let aperture: string | undefined;
  let shutterSpeed: string | undefined;
  let takenAt: Date | undefined;

  try {
    const exif = metadata.exif ? (await sharp(buffer).metadata()).exif : null;
    // Sharp provides parsed EXIF in newer versions or raw buffers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsedExif = (metadata as any).parsedExif;
    if (parsedExif) {
      if (parsedExif.image?.Make || parsedExif.image?.Model) {
        cameraModel = [parsedExif.image?.Make, parsedExif.image?.Model]
          .filter(Boolean)
          .join(" ")
          .trim();
      }
      if (parsedExif.exif?.LensModel) {
        lens = String(parsedExif.exif.LensModel);
      }
      if (parsedExif.exif?.ISO) {
        iso = Number(parsedExif.exif.ISO);
      }
      if (parsedExif.exif?.FNumber) {
        aperture = `f/${parsedExif.exif.FNumber}`;
      }
      if (parsedExif.exif?.ExposureTime) {
        const exp = parsedExif.exif.ExposureTime;
        shutterSpeed = exp < 1 ? `1/${Math.round(1 / exp)}s` : `${exp}s`;
      }
      if (parsedExif.exif?.FocalLength) {
        focalLength = `${parsedExif.exif.FocalLength}mm`;
      }
      if (parsedExif.exif?.DateTimeOriginal) {
        takenAt = new Date(parsedExif.exif.DateTimeOriginal);
      }
    }
  } catch {
    // Ignore exif parsing issues non-fatally
  }

  return {
    width,
    height,
    format,
    fileSize,
    aspectRatio,
    colorSpace,
    cameraModel,
    lens,
    focalLength,
    iso,
    aperture,
    shutterSpeed,
    takenAt,
  };
}

export function validateImageRules(
  imageMeta: ImageMetadata,
  rules: ContestRules,
  filename?: string
): RuleValidationResult {
  const errors: string[] = [];

  // File size validation
  const maxBytes = rules.maxFileSizeMb * 1024 * 1024;
  if (imageMeta.fileSize > maxBytes) {
    const currentMb = (imageMeta.fileSize / (1024 * 1024)).toFixed(2);
    errors.push(
      `Dateigröße (${currentMb} MB) überschreitet das Maximum von ${rules.maxFileSizeMb} MB.`
    );
  }

  // Format validation
  const allowed = rules.allowedFormats
    .toLowerCase()
    .split(",")
    .map((f) => f.trim().replace("image/", ""));

  const normalizedFormat =
    imageMeta.format === "jpeg" || imageMeta.format === "jpg" ? "jpg" : imageMeta.format;

  const isAllowedFormat = allowed.some((ext) => {
    if (ext === "jpeg" || ext === "jpg") return normalizedFormat === "jpg";
    return ext === normalizedFormat;
  });

  if (!isAllowedFormat) {
    errors.push(
      `Format '${imageMeta.format.toUpperCase()}' ist nicht erlaubt. Erlaubt sind: ${rules.allowedFormats}`
    );
  }

  // Color space validation
  if (imageMeta.colorSpace && imageMeta.colorSpace.toLowerCase() === "cmyk") {
    errors.push(
      "Das Bild liegt im CMYK-Druckfarbraum vor. Für Web-Wettbewerbe muss das Bild im sRGB- oder RGB-Farbraum vorliegen."
    );
  }

  // Dimension validations
  if (rules.minWidth && imageMeta.width < rules.minWidth) {
    errors.push(
      `Bildbreite (${imageMeta.width}px) unterschreitet die Mindestbreite von ${rules.minWidth}px.`
    );
  }
  if (rules.minHeight && imageMeta.height < rules.minHeight) {
    errors.push(
      `Bildhöhe (${imageMeta.height}px) unterschreitet die Mindesthöhe von ${rules.minHeight}px.`
    );
  }
  if (rules.maxWidth && imageMeta.width > rules.maxWidth) {
    errors.push(
      `Bildbreite (${imageMeta.width}px) überschreitet die Maximalbreite von ${rules.maxWidth}px.`
    );
  }
  if (rules.maxHeight && imageMeta.height > rules.maxHeight) {
    errors.push(
      `Bildhöhe (${imageMeta.height}px) überschreitet die Maximalhöhe von ${rules.maxHeight}px.`
    );
  }

  // Aspect ratio validation
  if (rules.aspectRatio && rules.aspectRatio !== "free" && rules.aspectRatio !== "") {
    const isPortrait = rules.aspectRatio.includes(":");
    if (isPortrait) {
      const [expectedW, expectedH] = rules.aspectRatio.split(":").map(Number);
      if (expectedW && expectedH) {
        const expectedRatio = expectedW / expectedH;
        const actualRatio = imageMeta.width / imageMeta.height;
        // Allow landscape or portrait equivalent if appropriate, or exact match with 5% tolerance
        const matchesStandard = Math.abs(actualRatio - expectedRatio) < 0.05;
        const matchesInverted = Math.abs(actualRatio - 1 / expectedRatio) < 0.05;

        if (!matchesStandard && !matchesInverted) {
          errors.push(
            `Seitenverhältnis entspricht nicht der Vorgabe (${rules.aspectRatio}). Erkannt: ${imageMeta.aspectRatio}`
          );
        }
      }
    }
  }

  // Naming pattern validation
  if (rules.namingPattern && filename) {
    // E.g. If naming pattern requires specific structure, check regex
    // For now, if specified, verify it matches
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
