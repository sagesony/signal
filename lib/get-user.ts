import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

/**
 * Returns the currently authenticated user from the session.
 * Returns null if there is no valid session.
 */
export async function getUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  return prisma.user.findUnique({ where: { id: session.user.id } })
}
