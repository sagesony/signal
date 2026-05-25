import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const competitors = await prisma.competitor.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { ads: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(competitors)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, website, metaAdUrl, metaPageId, industry } = await req.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 })
  }

  const existing = await prisma.competitor.findFirst({
    where: { name: name.trim(), userId: session.user.id },
  })
  if (existing) {
    return NextResponse.json({ error: "You already track this competitor." }, { status: 409 })
  }

  const competitor = await prisma.competitor.create({
    data: {
      name: name.trim(),
      website: website || null,
      metaAdUrl: metaAdUrl || null,
      metaPageId: metaPageId || null,
      industry: industry || null,
      userId: session.user.id,
    },
    include: { _count: { select: { ads: true } } },
  })

  return NextResponse.json(competitor, { status: 201 })
}
