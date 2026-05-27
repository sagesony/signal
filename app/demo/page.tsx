"use client"

import { useEffect, useState } from "react"
import { signIn } from "next-auth/react"
import { Zap, Loader2 } from "lucide-react"

export default function DemoPage() {
  const [error, setError] = useState(false)

  useEffect(() => {
    signIn("credentials", {
      email: "demo@signal.app",
      password: "demo1234",
      callbackUrl: "/ads",
    }).then((res) => {
      if (res?.error) setError(true)
    })
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <p className="text-sm text-muted-foreground mb-4">
            Demo account unavailable right now.
          </p>
          <a href="/register" className="text-sm text-indigo-400 hover:text-indigo-300">
            Create your own free account →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#08080f] flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.4)]">
        <Zap className="w-5 h-5 text-white fill-white" />
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading demo…
      </div>
    </div>
  )
}
