import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit-logger";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          // Find user in database
          const user = await prisma.adminUser.findUnique({
            where: { username: credentials.username },
          });

          if (!user || !user.isActive) {
            // Log failed login attempt
            await logAdminAction(
              credentials.username,
              "LOGIN_FAILED",
              `Failed login attempt - User not found or inactive`,
              { level: "WARN" }
            );
            return null;
          }

          // Verify password with bcrypt
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isValidPassword) {
            // Log failed login attempt
            await logAdminAction(
              credentials.username,
              "LOGIN_FAILED",
              `Failed login attempt - Invalid password`,
              { level: "WARN" }
            );
            return null;
          }

          // Update last login time
          await prisma.adminUser.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          // Log successful login
          await logAdminAction(
            user.username,
            "LOGIN_SUCCESS",
            `User logged in successfully`,
            { userId: user.id, level: "INFO" }
          );

          // Return user object for session
          return {
            id: user.id.toString(),
            name: user.username,
            email: user.email || `${user.username}@admin.local`,
            role: user.role,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 60 minutes (1 hour)
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.username = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).username = token.username;
      }
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      // Log logout
      if (token?.username) {
        await logAdminAction(
          token.username as string,
          "LOGOUT",
          `User logged out`,
          { userId: parseInt(token.id as string), level: "INFO" }
        );
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
