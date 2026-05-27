"use client"

import { useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Zap, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/ads"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleGoogle() {
    setGoogleLoading(true)
    setError("")
    await signIn("google", { callbackUrl })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await signIn("credentials", { email, password, redirect: false })

    if (res?.error) {
      setError("Incorrect email or password.")
      setLoading(false)
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <div className="relative z-10 w-full max-w-sm">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to home
      </Link>

      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
          <Zap className="w-4 h-4 text-white fill-white" />
        </div>
        <span className="text-lg font-semibold tracking-tight">Signal</span>
      </div>

      <div className="mb-7">
        <h1 className="text-2xl font-semibold tracking-tight mb-1.5">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your Signal account.</p>
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading}
        className={cn(
          "w-full h-11 rounded-lg text-sm font-medium mb-4",
          "border border-border bg-card hover:bg-accent",
          "flex items-center justify-center gap-3",
          "transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        )}
      >
        {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon className="w-4 h-4" />}
        Continue with Google
      </button>

      {/* Divider */}
      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#08080f] px-3 text-xs text-muted-foreground/60">or</span>
        </div>
      </div>

      {/* Credentials */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          required
          autoComplete="email"
          className={cn(
            "w-full h-10 px-3 rounded-lg text-sm bg-muted border border-border",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-1 focus:ring-indigo-500/60 focus:border-indigo-500/60 transition-colors"
          )}
        />
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            autoComplete="current-password"
            className={cn(
              "w-full h-10 px-3 pr-10 rounded-lg text-sm bg-muted border border-border",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-1 focus:ring-indigo-500/60 focus:border-indigo-500/60 transition-colors"
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full h-10 rounded-lg text-sm font-medium",
            "bg-indigo-600 hover:bg-indigo-500 text-white",
            "flex items-center justify-center gap-2",
            "transition-colors shadow-[0_0_20px_rgba(99,102,241,0.3)]",
            "disabled:opacity-60 disabled:cursor-not-allowed"
          )}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Sign in
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        No account?{" "}
        <Link href="/register" className="text-indigo-400 hover:text-indigo-300 transition-colors">
          Create one free
        </Link>
      </p>
      <p className="text-center text-xs text-muted-foreground/50 mt-3">
        Just want to look around?{" "}
        <Link href="/demo" className="text-indigo-400/70 hover:text-indigo-400 transition-colors">
          View demo →
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
