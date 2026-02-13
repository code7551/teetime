import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.ACTIVATION_JWT_SECRET || "ttgc-default-secret-change-me"
);

export interface ActivationPayload {
  studentId: string;
  studentName: string;
}

export async function createActivationCode(
  studentId: string,
  studentName: string
): Promise<string> {
  const jwt = await new SignJWT({ studentId, studentName } as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("ttgc")
    .setSubject(studentId)
    .sign(SECRET);
  return jwt;
}

export async function verifyActivationCode(
  token: string
): Promise<ActivationPayload> {
  const { payload } = await jwtVerify(token, SECRET, {
    issuer: "ttgc",
  });
  return {
    studentId: payload.studentId as string,
    studentName: payload.studentName as string,
  };
}
