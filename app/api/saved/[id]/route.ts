import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUser } from "@/lib/get-user"

export const dynamic = "force-dynamic"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "No user found" }, { status: 404 })

  const { notes, tags } = await req.json()

  const savedAd = await prisma.savedAd.findFirst({
    where: { id: params.id, userId: user.id },
  })
  if (!savedAd) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const updated = await prisma.savedAd.update({
    where: { id: params.id },
    data: { notes: notes ?? null, tags: tags ?? null },
  })

  return NextResponse.json(updated)
}
