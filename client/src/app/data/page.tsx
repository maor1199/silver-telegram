"use client"

import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
  Upload, FileText, CheckCircle2, AlertCircle, AlertTriangle,
  Download, ArrowRight, X, RefreshCw, Database, Info,
} from "lucide-react"
import { parseCSV, generateCSVTemplate, CSV_TEMPLATE_HEADERS } from "@/lib/intelligence/csv-parser"
import { saveSkus, clearSkus } from "@/lib/intelligence/store"
import { cn } from "@/lib/utils"

// ─── Column reference table ───────────────────────────────────────────────────

const COLUMN_DOCS: { col: string; required: boolean; desc: string; example: string }[] = [
  { col: "sku_name",              required: true,  desc: "Product name (your reference label)",             example: "Bamboo Cutting Board Set" },
  { col: "selling_price",         required: true,  desc: "Average selling price in USD",                    example: "34.99" },
  { col: "cogs",                  required: true,  desc: "Cost of goods (unit cost from supplier)",         example: "7.20" },
  { col: "current_inventory",     required: true,  desc: "Units currently in stock / in FBA warehouse",     example: "54" },
  { col: "avg_daily_sales",       required: true,  desc: "Average units sold per day (last 30 days)",       example: "9" },
  { col: "platform_fees",         required: false, desc: "Amazon referral + FBA fee per unit",              example: "8.40" },
  { col: "monthly_ad_spend",      required: false, desc: "Total PPC / advertising spend this month in $",  example: "820" },
  { col: "acos_percent",          required: false, desc: "Advertising Cost of Sales % (e.g. 28 for 28%)",  example: "28" },
  { col: "return_rate_percent",   required: false, desc: "% of units returned (e.g. 3 for 3%)",            example: "3" },
  { col: "monthly_storage_fee",   required: false, desc: "Total monthly storage cost for this SKU",        example: "94" },
  { col: "reorder_lead_time_days",required: false, desc: "Days from order to arrival (supplier lead time)", example: "28" },
  { col: "reorder_quantity",      required: false, desc: "How many units to order when reordering",         example: "500" },
  { col: "channel",               required: false, desc: "amazon / shopify / ebay / walmart / tiktok",     example: "amazon" },
  { col: "asin",                  required: false, desc: "Amazon ASIN (optional, for reference)",           example: "B08XK2J4NL" },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DataUploadPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [result, setResult] = useState<{
    skus: import("@/lib/intelligence/types").SKU[]
    errors: string[]
    warnings: string[]
    rowCount: number
    filename: string
  } | null>(null)
  const [saved, setSaved] = useState(false)

  // ── File processing ─────────────────────────────────────────────────────────

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      setResult({ skus: [], errors: ["Please upload a .csv file."], warnings: [], rowCount: 0, filename: file.name })
      return
    }
    setParsing(true)
    setSaved(false)
    try {
      const text = await file.text()
      const parsed = parseCSV(text)
      setResult({ ...parsed, filename: file.name })
    } catch (e) {
      setResult({ skus: [], errors: ["Failed to read file. Make sure it is a valid CSV."], warnings: [], rowCount: 0, filename: file.name })
    } finally {
      setParsing(false)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  // ── Save & navigate ─────────────────────────────────────────────────────────

  const handleSave = () => {
    if (!result?.skus.length) return
    saveSkus(result.skus, {
      source: "live",
      filename: result.filename,
      uploadedAt: new Date().toISOString(),
      rowCount: result.skus.length,
    })
    setSaved(true)
    setTimeout(() => router.push("/dashboard"), 1200)
  }

  const handleReset = () => {
    clearSkus()
    setResult(null)
    setSaved(false)
    if (fileRef.current) fileRef.current.value = ""
  }

  // ── Template download ────────────────────────────────────────────────────────

  const downloadTemplate = () => {
    const csv = generateCSVTemplate()
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sellermentor_sku_template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const hasErrors = (result?.errors?.length ?? 0) > 0
  const hasWarnings = (result?.warnings?.length ?? 0) > 0
  const hasSkus = (result?.skus?.length ?? 0) > 0

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-[900px] px-6 py-10">

          {/* ── Header ───────────────────────────────────────────────────────── */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <Database className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Import Your Data</h1>
            </div>
            <p className="text-sm text-muted-foreground max-w-lg">
              Upload a CSV with your SKU data to replace the sample data. SellerMentor will immediately run the full risk engine on your actual business.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-6">

            {/* ── Left: upload + result ─────────────────────────────────────── */}
            <div className="lg:col-span-3 space-y-4">

              {/* Step 1 — Download template */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground mb-1">Download the template</p>
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                      Fill in your SKU data using the template. Only 5 columns are required — the rest improve accuracy.
                    </p>
                    <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2 rounded-xl">
                      <Download className="h-3.5 w-3.5" />
                      sellermentor_sku_template.csv
                    </Button>
                  </div>
                </div>
              </div>

              {/* Step 2 — Upload */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground mb-3">Upload your CSV</p>
                    <div
                      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileRef.current?.click()}
                      className={cn(
                        "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all",
                        dragOver
                          ? "border-primary bg-primary/5 scale-[1.01]"
                          : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
                      )}
                    >
                      <Upload className={cn("h-8 w-8 mb-3 transition-colors", dragOver ? "text-primary" : "text-muted-foreground")} />
                      <p className="text-sm font-semibold text-foreground">Drop your CSV here</p>
                      <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                      <p className="mt-3 text-[10px] text-muted-foreground/60">.csv files only</p>
                      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Parse result */}
              {parsing && (
                <div className="rounded-2xl border border-border bg-card p-6 text-center">
                  <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Parsing your data...
                  </div>
                </div>
              )}

              {result && !parsing && (
                <div className="space-y-3">
                  {/* Errors */}
                  {hasErrors && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <p className="text-sm font-semibold text-red-700">Upload failed</p>
                      </div>
                      <ul className="space-y-1">
                        {result.errors.map((e, i) => <li key={i} className="text-xs text-red-600 leading-relaxed">{e}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Warnings */}
                  {hasWarnings && !hasErrors && (
                    <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <p className="text-sm font-semibold text-yellow-700">{result.warnings.length} row{result.warnings.length !== 1 ? "s" : ""} skipped</p>
                      </div>
                      <ul className="space-y-1">
                        {result.warnings.map((w, i) => <li key={i} className="text-xs text-yellow-700 leading-relaxed">{w}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Success preview */}
                  {hasSkus && (
                    <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <p className="text-sm font-semibold text-green-700">
                          {result.skus.length} SKU{result.skus.length !== 1 ? "s" : ""} parsed from {result.filename}
                        </p>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-green-200 bg-white mb-4">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-green-100 bg-green-50/50">
                              <th className="px-3 py-2 text-left font-semibold text-green-700">SKU</th>
                              <th className="px-3 py-2 text-right font-semibold text-green-700">Price</th>
                              <th className="px-3 py-2 text-right font-semibold text-green-700">Stock</th>
                              <th className="px-3 py-2 text-right font-semibold text-green-700">Daily Sales</th>
                              <th className="px-3 py-2 text-right font-semibold text-green-700">Margin %</th>
                              <th className="px-3 py-2 text-right font-semibold text-green-700">Days Left</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-green-100">
                            {result.skus.slice(0, 8).map(sku => (
                              <tr key={sku.id}>
                                <td className="px-3 py-2 font-medium text-foreground max-w-[140px] truncate">{sku.name}</td>
                                <td className="px-3 py-2 text-right tabular-nums">${sku.sellingPrice.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{sku.currentInventory}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{sku.avgDailySales}</td>
                                <td className={cn("px-3 py-2 text-right tabular-nums font-semibold", sku.marginPercent < 0 ? "text-red-600" : sku.marginPercent < 12 ? "text-orange-600" : "text-green-600")}>
                                  {sku.marginPercent.toFixed(1)}%
                                </td>
                                <td className={cn("px-3 py-2 text-right tabular-nums font-semibold", sku.daysUntilStockout < sku.reorderLeadTimeDays ? "text-red-600" : sku.daysUntilStockout < 30 ? "text-orange-600" : "text-foreground")}>
                                  {sku.daysUntilStockout > 999 ? "∞" : `${sku.daysUntilStockout}d`}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {result.skus.length > 8 && (
                          <p className="text-center py-2 text-xs text-muted-foreground border-t border-green-100">
                            +{result.skus.length - 8} more SKUs
                          </p>
                        )}
                      </div>

                      {saved ? (
                        <div className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-green-700">
                          <CheckCircle2 className="h-4 w-4" />
                          Saved — opening Command Center...
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <Button onClick={handleSave} className="flex-1 rounded-xl gap-2">
                            Activate — run risk engine on my data
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={handleReset} className="rounded-xl flex-shrink-0" title="Upload different file">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3 — after save */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">3</div>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">Review your Command Center</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      After upload, the risk engine runs immediately on your data. Your Command Center, Inventory Risk, and Profit pages all update to show your real business.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right: column reference ────────────────────────────────────── */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-border bg-card p-5 sticky top-20">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Column Reference</h3>
                </div>
                <div className="space-y-2 max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
                  {COLUMN_DOCS.map(col => (
                    <div key={col.col} className={cn(
                      "rounded-xl p-3 border",
                      col.required ? "border-primary/20 bg-primary/[0.03]" : "border-border bg-muted/20"
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-[11px] font-mono font-semibold text-foreground">{col.col}</code>
                        {col.required && (
                          <span className="rounded-full bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider">Required</span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{col.desc}</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-0.5">e.g. <span className="text-foreground/70">{col.example}</span></p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Privacy note ────────────────────────────────────────────────── */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Your data is processed locally and stored in your browser only. Nothing is sent to any server during CSV import.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
