import type { NextAuthOptions } from "next-auth"

export const authOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [],
} satisfies NextAuthOptions
