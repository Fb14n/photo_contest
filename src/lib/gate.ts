import { SignJWT, jwtVerify } from "jose";

const GATE_COOKIE_NAME = "fc_gate";
const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "photo-contest-gate-secret-key-2026"
);

export function isGateEnabled(): boolean {
  const sitePassword = process.env.SITE_PASSWORD;
  return Boolean(sitePassword && sitePassword.trim().length > 0);
}

export function verifySitePassword(password: string): boolean {
  const sitePassword = process.env.SITE_PASSWORD;
  if (!sitePassword) return true;
  return password.trim() === sitePassword.trim();
}

export async function createGateToken(): Promise<string> {
  return new SignJWT({ gateAccess: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET_KEY);
}

export async function verifyGateToken(token?: string): Promise<boolean> {
  if (!isGateEnabled()) return true;
  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return Boolean(payload && payload.gateAccess === true);
  } catch {
    return false;
  }
}

export { GATE_COOKIE_NAME };
