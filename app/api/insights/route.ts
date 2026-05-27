export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category") ?? ""

  const insights = await prisma.insight.findMany({
    where: category ? { category } : {},
    orderBy: [{ isNew: "desc" }, { createdAt: "desc" }],
  })

  const result = insights.map((insight) => ({
    ...insight,
    competitors: JSON.parse(insight.competitors ?? "[]"),
    tags: JSON.parse(insight.tags ?? "[]"),
  }))

  return NextResponse.json(result)
}
