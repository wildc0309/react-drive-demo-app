import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_AUTH_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/drive",
          prompt: "consent",
          access_type: "offline",
        },
      },
    }),
  ],
  debug: true,
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expires_at = account.expires_at;
      }
      return token;
    },
    async session({ session, token }: any) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
