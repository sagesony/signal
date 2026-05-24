import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { notes, tags } = await req.json()

  const savedAd = await prisma.savedAd.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!savedAd) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const updated = await prisma.savedAd.update({
    where: { id: params.id },
    data: { notes: notes ?? null, tags: tags ?? null },
  })

  return NextResponse.json(updated)
}
