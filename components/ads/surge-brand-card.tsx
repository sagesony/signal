"use client"

import Image from "next/image"
import Link from "next/link"
import { getBrandLogoUrl } from "@/lib/utils"
import type { Ad, Competitor } from "@/types"

interface SurgeBrandCardProps {
  competitor: Competitor & { _count: { ads: number } }
  newAds: Ad[]
  newCount: number
}

export function SurgeBrandCard({ competitor, newAds, newCount }: SurgeBrandCardProps) {
  const initials = competitor.name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const thumbnails = newAds.filter((ad) => ad.imageUrl).slice(0, 3)

  return (
    <Link
      href={`/ads?brand=${competitor.id}&brandName=${encodeURIComponent(competitor.name)}`}
      className="group w-44 shrink-0 rounded-xl border border-emerald-500/20 bg-card overflow-hidden hover:border-emerald-500/40 hover:-translate-y-0.5 transition-all duration-200 block"
    >
      <div className="p-3.5">
        {/* Brand header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg overflow-hidden border border-border bg-muted shrink-0 flex items-center justify-center">
            {(competitor.logo || getBrandLogoUrl(competitor.metaPageId)) ? (
              <Image
                src={competitor.logo ?? getBrandLogoUrl(competitor.metaPageId)!}
                alt={competitor.name}
                width={28} height={28}
                unoptimized
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-[10px] font-bold text-indigo-300">{initials}</span>
            )}
          </div>
          <p className="text-xs font-semibold truncate">{competitor.name}</p>
        </div>

        {/* Big number */}
        <div className="mb-3">
          <p className="text-3xl font-bold text-emerald-400 leading-none tabular-nums">
            {newCount}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">new ads this week</p>
        </div>

        {/* Thumbnail strip */}
        {thumbnails.length > 0 && (
          <div className="flex gap-1.5">
            {thumbnails.map((ad) => (
              <div
                key={ad.id}
                className="relative w-11 h-11 rounded-md overflow-hidden bg-muted ring-1 ring-border"
              >
                <Image
                  src={ad.imageUrl!}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="44px"
                />
              </div>
            ))}
            {newAds.length > thumbnails.length && (
              <div className="w-11 h-11 rounded-md bg-muted ring-1 ring-border flex items-center justify-center">
                <span className="text-[10px] font-medium text-muted-foreground">
                  +{newAds.length - thumbnails.length}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
