import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      uid: string,
      emailVerified: boolean,
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    emailVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    emailVerified: boolean;
  }
}