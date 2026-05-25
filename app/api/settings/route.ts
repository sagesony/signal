import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { randomBytes } from "crypto"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { metaAccessToken: true, extensionKey: true },
  })

  return NextResponse.json({
    hasMetaToken: !!user?.metaAccessToken,
    metaAccessToken: user?.metaAccessToken
      ? `${user.metaAccessToken.slice(0, 6)}…${user.metaAccessToken.slice(-4)}`
      : null,
    hasExtensionKey: !!user?.extensionKey,
    extensionKey: user?.extensionKey ?? null,
  })
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { metaAccessToken, generateExtensionKey, revokeExtensionKey } = body

  const data: Record<string, string | null> = {}

  if ("metaAccessToken" in body) {
    data.metaAccessToken = metaAccessToken?.trim() || null
  }

  if (generateExtensionKey) {
    data.extensionKey = randomBytes(32).toString("hex")
  }

  if (revokeExtensionKey) {
    data.extensionKey = null
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { metaAccessToken: true, extensionKey: true },
  })

  return NextResponse.json({
    success: true,
    hasMetaToken: !!updated.metaAccessToken,
    hasExtensionKey: !!updated.extensionKey,
    extensionKey: updated.extensionKey ?? null,
  })
}
