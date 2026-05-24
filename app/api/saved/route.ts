import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const savedAds = await prisma.savedAd.findMany({
    where: { userId: session.user.id },
    include: {
      ad: {
        include: {
          competitor: { select: { id: true, name: true, logo: true, industry: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(savedAds)
}
