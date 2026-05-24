import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const savedAd = await prisma.savedAd.upsert({
    where: { userId_adId: { userId: session.user.id, adId: params.id } },
    update: {},
    create: { userId: session.user.id, adId: params.id },
  })

  return NextResponse.json(savedAd, { status: 201 })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await prisma.savedAd.deleteMany({
    where: { userId: session.user.id, adId: params.id },
  })

  return NextResponse.json({ success: true })
}
