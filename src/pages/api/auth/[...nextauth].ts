import NextAuth, { NextAuthOptions, Session, User, SessionStrategy } from "next-auth";
import { FirestoreAdapter } from "@auth/firebase-adapter"
import { cert } from "firebase-admin/app"
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { firebaseApp } from "@/firebase/firebase.config";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";
import NaverProvider from "next-auth/providers/naver";
import CredentialsProvider from "next-auth/providers/credentials";
import { FirebaseError } from "firebase/app";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  // Configure one or more authentication providers
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!
    }),
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID!,
      clientSecret: process.env.NAVER_CLIENT_SECRET!
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        const auth = getAuth(firebaseApp);

        try {
          const credentialUser = await signInWithEmailAndPassword(auth, credentials?.email || '', credentials?.password || '');
          if (credentialUser) {
            // const idToken = await credentialUser.user.getIdToken();
            if (!credentialUser.user.emailVerified) {
              throw new FirebaseError("email-not-verified", "Email not verified");
            } else {
              return {
                id: credentialUser.user.uid,
                email: credentialUser.user.email,
                name: credentialUser.user.displayName,
                image: credentialUser.user.photoURL,
                emailVerified: credentialUser.user.emailVerified
              }
            }
          } else {
            throw new FirebaseError("credential-not-created", "Credential not created");
          }
        } catch (error) {
          const e = error as FirebaseError;
          console.log(error);
          // TODO sending eorror message 
          throw new Error(e.code);
        }
      }
    })
  ],
  adapter: FirestoreAdapter({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    })
  }),
  callbacks: {
    async jwt({ token, user }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      // console.log('jwt--->', token, user);
      if (user) token.emailVerified = user.emailVerified as boolean;
      return token
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from a provider.
      // console.log('session--->', session, token)
      if (session?.user) {
        session.user.emailVerified = token.emailVerified;
        session.user.uid = token.sub!;
      }

      return session
    }
  }
}

export default NextAuth(authOptions)