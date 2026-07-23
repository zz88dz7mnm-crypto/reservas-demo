import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { supabase } from "./supabase";
import { rateLimit } from "./rate-limit";

const secret = process.env.NEXTAUTH_SECRET;
if (!secret && process.env.NODE_ENV === "production") {
  throw new Error("NEXTAUTH_SECRET debe configurarse en producción.");
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const rl = rateLimit("login", credentials.username.toLowerCase(), 5, 15 * 60 * 1000);
        if (!rl.ok) return null;

        const { data: admin } = await supabase
          .from("admins")
          .select("id, username, password_hash")
          .eq("username", credentials.username)
          .maybeSingle();

        if (!admin) return null;
        if (!bcrypt.compareSync(credentials.password, admin.password_hash)) return null;

        return { id: String(admin.id), name: admin.username };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  secret: secret || "supersecret-local-dev",
  callbacks: {
    jwt({ token, user }) {
      if (user) token.adminId = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.adminId) (session.user as Record<string, unknown>).id = token.adminId;
      return session;
    },
  },
};
