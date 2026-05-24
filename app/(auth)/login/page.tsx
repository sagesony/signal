"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Zap, Eye, EyeOff, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (res?.error) {
      setError("Invalid email or password.")
      return
    }
    router.push("/dashboard")
    router.refresh()
  }

  async function loginAsDemo() {
    setEmail("demo@signal.app")
    setPassword("demo1234")
    setLoading(true)
    setError("")
    const res = await signIn("credentials", {
      email: "demo@signal.app",
      password: "demo1234",
      redirect: false,
    })
    setLoading(false)
    if (res?.ok) {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/5 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center signal-glow">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Signal</span>
        </div>

        <div className="mb-7">
          <h1 className="text-2xl font-semibold tracking-tight mb-1.5">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your intelligence feed.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground/80" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@brand.com"
              required
              className={cn(
                "w-full h-10 px-3 rounded-lg text-sm",
                "bg-muted border border-border",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring",
                "transition-colors"
              )}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground/80" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={cn(
                  "w-full h-10 px-3 pr-10 rounded-lg text-sm",
                  "bg-muted border border-border",
                  "placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring",
                  "transition-colors"
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
              "transition-colors signal-glow",
              "disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Sign in
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-background text-xs text-muted-foreground">or</span>
          </div>
        </div>

        <button
          onClick={loginAsDemo}
          disabled={loading}
          className={cn(
            "w-full h-10 rounded-lg text-sm font-medium",
            "bg-muted hover:bg-muted/80 text-foreground border border-border hover:border-border/80",
            "transition-colors",
            "disabled:opacity-60 disabled:cursor-not-allowed"
          )}
        >
          Continue with demo account
        </button>

        <p className="text-center text-sm text-muted-foreground mt-6">
          No account?{" "}
          <Link href="/register" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
