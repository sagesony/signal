import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUser } from "@/lib/get-user"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json([])

  const competitors = await prisma.competitor.findMany({
    where: { userId: user.id },
    include: { _count: { select: { ads: true } } },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json(competitors)
}

export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "No user found" }, { status: 404 })

  const { name, website, metaAdUrl, metaPageId, industry } = await req.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 })
  }

  const existing = await prisma.competitor.findFirst({
    where: { name: name.trim(), userId: user.id },
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
      userId: user.id,
    },
    include: { _count: { select: { ads: true } } },
  })

  return NextResponse.json(competitor, { status: 201 })
}
