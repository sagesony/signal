import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

async function getCompetitor(id: string, userId: string) {
  return prisma.competitor.findFirst({ where: { id, userId } })
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const competitor = await getCompetitor(params.id, session.user.id)
  if (!competitor) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(competitor)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const competitor = await getCompetitor(params.id, session.user.id)
  if (!competitor) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.competitor.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
