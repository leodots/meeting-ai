import { timingSafeEqual } from "crypto";

export function isValidInternalToken(token: string | null): boolean {
  const expected = process.env.JARVIS_UPLOAD_TOKEN;

  if (!expected || !token) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const tokenBuffer = Buffer.from(token);

  if (expectedBuffer.length !== tokenBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, tokenBuffer);
}

export function getBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice("Bearer ".length).trim();
}

