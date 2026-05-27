import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"

function generateExtensionKey() {
  return randomBytes(24).toString("hex")
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    // Google OAuth — only enabled when env vars are present
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })
        if (!user?.password) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name, image: user.image }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Google OAuth: find or create the user in our DB
      if (account?.provider === "google" && user.email) {
        const existing = await prisma.user.findUnique({ where: { email: user.email } })
        if (existing) {
          user.id = existing.id
          // Sync Google avatar if the user doesn't have one yet
          if (user.image && !existing.image) {
            await prisma.user.update({
              where: { id: existing.id },
              data: { image: user.image, name: user.name ?? existing.name },
            })
          }
        } else {
          const created = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name,
              image: user.image,
              extensionKey: generateExtensionKey(),
            },
          })
          user.id = created.id
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (token) session.user.id = token.id as string
      return session
    },
  },
  pages: { signIn: "/login", error: "/login" },
}
