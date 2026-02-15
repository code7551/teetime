import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

function getAdminApp(): App {
  const apps = getApps();
  if (apps.length > 0) return apps[0];

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "",
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || "",
      privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(
        /\\n/g,
        "\n"
      ),
    }),
  });
}

let _auth: Auth | null = null;

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_, prop) {
    if (!_auth) _auth = getAuth(getAdminApp());
    return (_auth as unknown as Record<string | symbol, unknown>)[prop];
  },
});
