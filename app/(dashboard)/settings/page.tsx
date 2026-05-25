"use client"

import { useEffect, useState } from "react"
import { Settings, CheckCircle2, AlertCircle, ExternalLink, Loader2, Eye, EyeOff, Copy, Puzzle, RefreshCw } from "lucide-react"
import { Topbar } from "@/components/layout/topbar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasToken, setHasToken] = useState(false)
  const [maskedToken, setMaskedToken] = useState<string | null>(null)
  const [tokenInput, setTokenInput] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [extensionKey, setExtensionKey] = useState<string | null>(null)
  const [generatingKey, setGeneratingKey] = useState(false)
  const [keyCopied, setKeyCopied] = useState(false)

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setHasToken(data.hasMetaToken)
        setMaskedToken(data.metaAccessToken)
        setExtensionKey(data.extensionKey)
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    if (!tokenInput.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metaAccessToken: tokenInput.trim() }),
      })
      const data = await res.json()
      setHasToken(data.hasMetaToken)
      setMaskedToken(`${tokenInput.slice(0, 6)}…${tokenInput.slice(-4)}`)
      setTokenInput("")
      toast({ title: "Meta token saved", description: "You can now search and sync real ads." })
    } catch {
      toast({ title: "Failed to save token", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function handleGenerateKey() {
    setGeneratingKey(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generateExtensionKey: true }),
      })
      const data = await res.json()
      setExtensionKey(data.extensionKey)
      toast({ title: "Extension key generated" })
    } catch {
      toast({ title: "Failed to generate key", variant: "destructive" })
    } finally {
      setGeneratingKey(false)
    }
  }

  async function handleRevokeKey() {
    setGeneratingKey(true)
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revokeExtensionKey: true }),
      })
      setExtensionKey(null)
      toast({ title: "Extension key revoked" })
    } catch {
      toast({ title: "Failed to revoke key", variant: "destructive" })
    } finally {
      setGeneratingKey(false)
    }
  }

  function copyKey() {
    if (!extensionKey) return
    navigator.clipboard.writeText(extensionKey)
    setKeyCopied(true)
    setTimeout(() => setKeyCopied(false), 2000)
  }

  async function handleRemove() {
    setSaving(true)
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metaAccessToken: null }),
      })
      setHasToken(false)
      setMaskedToken(null)
      setTokenInput("")
      toast({ title: "Meta token removed" })
    } catch {
      toast({ title: "Failed to remove token", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const inputCls = cn(
    "w-full h-9 px-3 rounded-lg text-sm font-mono",
    "bg-muted border border-border",
    "placeholder:text-muted-foreground placeholder:font-sans",
    "focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring",
    "transition-colors"
  )

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <Topbar
        title="Settings"
        description="Configure integrations and data sources."
      />

      {/* Meta Ad Library */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Settings className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Meta Ad Library</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Search real brands and sync their active ads automatically.
              </p>
            </div>
          </div>
          {!loading && (
            <div className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border shrink-0",
              hasToken
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-muted border-border text-muted-foreground"
            )}>
              {hasToken
                ? <><CheckCircle2 className="w-3 h-3" /> Connected</>
                : <><AlertCircle className="w-3 h-3" /> Not connected</>
              }
            </div>
          )}
        </div>

        {/* How to get token */}
        <div className="rounded-lg bg-muted/60 border border-border p-4 space-y-3">
          <p className="text-xs font-medium text-foreground">How to get your access token</p>
          <ol className="space-y-1.5 text-xs text-muted-foreground list-decimal list-inside">
            <li>
              Go to{" "}
              <a
                href="https://developers.facebook.com/tools/explorer/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:underline inline-flex items-center gap-0.5"
              >
                Meta Graph API Explorer <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </li>
            <li>Select your app (or create a free one at developers.facebook.com)</li>
            <li>
              Click <span className="font-medium text-foreground">Add a Permission</span> and add{" "}
              <span className="inline-flex gap-1">
                <code className="text-[11px] bg-background px-1 py-0.5 rounded border border-border">ads_read</code>
                <span className="text-muted-foreground">and</span>
                <code className="text-[11px] bg-background px-1 py-0.5 rounded border border-border">pages_read_engagement</code>
              </span>
            </li>
            <li>Click <span className="font-medium text-foreground">Generate Access Token</span> and log in</li>
            <li>Copy the token and paste it below</li>
          </ol>
          <p className="text-[11px] text-muted-foreground">
            Tokens expire after ~60 days.{" "}
            <span className="text-amber-400/80">
              If you still see permission errors, your Meta app may need Ad Library API access —{" "}
              <a
                href="https://www.facebook.com/ads/library/api/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-amber-300"
              >
                apply here
              </a>
              .
            </span>
          </p>
        </div>

        {/* Fallback tip */}
        <div className="rounded-lg border border-border p-3 flex items-start gap-2.5">
          <div className="w-5 h-5 rounded bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-[10px] text-indigo-400 font-bold">💡</span>
          </div>
          <div>
            <p className="text-xs font-medium">Can&apos;t search by name? Use the page ID directly.</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Go to{" "}
              <a href="https://www.facebook.com/ads/library/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                facebook.com/ads/library
              </a>
              , search the brand and click their page. The URL will contain{" "}
              <code className="text-[11px] bg-muted px-1 py-0.5 rounded border border-border">view_all_page_id=619181354927737</code>{" "}
              — copy just that number and paste it into Signal&apos;s search box. No permissions needed.
            </p>
          </div>
        </div>

        {/* Token status / input */}
        {loading ? (
          <div className="h-9 rounded-lg bg-muted animate-pulse" />
        ) : hasToken ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-9 px-3 rounded-lg bg-muted border border-border flex items-center">
                <span className="text-sm font-mono text-muted-foreground">{maskedToken}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleRemove} disabled={saving} className="text-destructive hover:text-destructive">
                Remove
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Token is saved. You can search brands and sync ads from the Competitors page.
            </p>
            {/* Replace token */}
            <div className="pt-1">
              <p className="text-xs text-muted-foreground mb-2">Replace token:</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showToken ? "text" : "password"}
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Paste new token..."
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken((s) => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <Button onClick={handleSave} disabled={saving || !tokenInput.trim()} size="sm">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Update"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showToken ? "text" : "password"}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Paste your Meta access token..."
                  className={inputCls}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                />
                <button
                  type="button"
                  onClick={() => setShowToken((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <Button onClick={handleSave} disabled={saving || !tokenInput.trim()}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connect"}
              </Button>
            </div>
          </div>
        )}
      </div>
      {/* Chrome Extension */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5 mt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
              <Puzzle className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Chrome Extension</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sync ads directly from Meta Ad Library in your browser — no proxy needed.
              </p>
            </div>
          </div>
          {!loading && (
            <div className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border shrink-0",
              extensionKey
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-muted border-border text-muted-foreground"
            )}>
              {extensionKey
                ? <><CheckCircle2 className="w-3 h-3" /> Active</>
                : <><AlertCircle className="w-3 h-3" /> Not set up</>
              }
            </div>
          )}
        </div>

        {/* How to install */}
        <div className="rounded-lg bg-muted/60 border border-border p-4 space-y-3">
          <p className="text-xs font-medium text-foreground">How to install the extension</p>
          <ol className="space-y-1.5 text-xs text-muted-foreground list-decimal list-inside">
            <li>Generate an API key below and copy it</li>
            <li>
              Download the extension folder from{" "}
              <a
                href="https://github.com/sagesony/signal/tree/main/chrome-extension"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:underline inline-flex items-center gap-0.5"
              >
                GitHub <ExternalLink className="w-2.5 h-2.5" />
              </a>{" "}
              (click Code → Download ZIP, then unzip)
            </li>
            <li>
              Open Chrome → <code className="text-[11px] bg-background px-1 py-0.5 rounded border border-border">chrome://extensions</code> → enable <strong className="text-foreground">Developer mode</strong>
            </li>
            <li>Click <strong className="text-foreground">Load unpacked</strong> and select the <code className="text-[11px] bg-background px-1 py-0.5 rounded border border-border">chrome-extension</code> folder</li>
            <li>Open the extension popup and paste your API key</li>
          </ol>
          <p className="text-[11px] text-muted-foreground pt-1">
            Then visit any competitor&apos;s Meta Ad Library page — the extension captures ads automatically as they load, and lets you sync them to Signal in one click.
          </p>
        </div>

        {/* API Key */}
        {loading ? (
          <div className="h-9 rounded-lg bg-muted animate-pulse" />
        ) : extensionKey ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Your API key — paste this into the extension popup:</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-9 px-3 rounded-lg bg-muted border border-border flex items-center overflow-hidden">
                <span className="text-xs font-mono text-muted-foreground truncate">{extensionKey}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={copyKey} className="shrink-0">
                {keyCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {keyCopied ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleGenerateKey} disabled={generatingKey} className="text-xs">
                {generatingKey ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Regenerate
              </Button>
              <Button variant="ghost" size="sm" onClick={handleRevokeKey} disabled={generatingKey} className="text-xs text-destructive hover:text-destructive">
                Revoke
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs text-muted-foreground mb-3">Generate an API key to connect the Chrome extension.</p>
            <Button onClick={handleGenerateKey} disabled={generatingKey}>
              {generatingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Puzzle className="w-4 h-4" />}
              Generate API Key
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
