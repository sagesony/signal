import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUser } from "@/lib/get-user"

export const dynamic = "force-dynamic"

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "No user found" }, { status: 404 })

  const savedAd = await prisma.savedAd.upsert({
    where: { userId_adId: { userId: user.id, adId: params.id } },
    update: {},
    create: { userId: user.id, adId: params.id },
  })

  return NextResponse.json(savedAd, { status: 201 })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "No user found" }, { status: 404 })

  await prisma.savedAd.deleteMany({
    where: { userId: user.id, adId: params.id },
  })

  return NextResponse.json({ success: true })
}
