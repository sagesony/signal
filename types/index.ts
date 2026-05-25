export interface Competitor {
  id: string
  name: string
  website: string | null
  metaAdUrl: string | null
  metaPageId: string | null
  logo: string | null
  industry: string | null
  userId: string
  _count?: { ads: number }
  createdAt: string
  updatedAt: string
}

export interface Ad {
  id: string
  competitorId: string
  competitor: { id: string; name: string; logo: string | null; industry: string | null }
  headline: string
  body: string | null
  cta: string | null
  imageUrl: string | null
  landingUrl: string | null
  hookType: string | null
  angleType: string | null
  formatType: string | null
  offerType: string | null
  platform: string
  isActive: boolean
  firstSeen: string
  lastSeen: string
  isSaved?: boolean
  savedAd?: SavedAd | null
  createdAt: string
  updatedAt: string
}

export interface SavedAd {
  id: string
  userId: string
  adId: string
  notes: string | null
  tags: string | null
  ad: Ad
  createdAt: string
  updatedAt: string
}

export interface Insight {
  id: string
  title: string
  summary: string
  confidence: number
  competitors: string[]
  tags: string[]
  category: string
  isNew: boolean
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  totalCompetitors: number
  totalAds: number
  newInsights: number
  savedAds: number
  recentAds: Ad[]
  topInsights: Insight[]
}

export type FilterState = {
  competitor: string
  hookType: string
  angleType: string
  formatType: string
  offerType: string
  search: string
  longRunning: boolean
}
