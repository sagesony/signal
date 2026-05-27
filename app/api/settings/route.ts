import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUser } from "@/lib/get-user"
import { randomBytes } from "crypto"

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "No user found" }, { status: 404 })

  const data = await prisma.user.findUnique({
    where: { id: user.id },
    select: { metaAccessToken: true, extensionKey: true },
  })

  return NextResponse.json({
    hasMetaToken: !!data?.metaAccessToken,
    metaAccessToken: data?.metaAccessToken
      ? `${data.metaAccessToken.slice(0, 6)}…${data.metaAccessToken.slice(-4)}`
      : null,
    hasExtensionKey: !!data?.extensionKey,
    extensionKey: data?.extensionKey ?? null,
  })
}

export async function PATCH(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "No user found" }, { status: 404 })

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
    where: { id: user.id },
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
