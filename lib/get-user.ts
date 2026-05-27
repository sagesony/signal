import { prisma } from "@/lib/db"

/** Single-user tool — returns the first user in the database. */
export async function getUser() {
  return prisma.user.findFirst()
}
