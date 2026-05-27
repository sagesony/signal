import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUser } from "@/lib/get-user"

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json([])

  const savedAds = await prisma.savedAd.findMany({
    where: { userId: user.id },
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
