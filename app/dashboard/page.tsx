"use client"

import { useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BarChart3,
  Search,
  Trash2,
  ExternalLink,
  Plus,
  FileText,
} from "lucide-react"

type SavedAnalysis = {
  id: string
  productName: string
  verdict: "GO" | "NO-GO"
  confidence: number
  date: string
  category: string
}

const savedAnalyses: SavedAnalysis[] = [
  {
    id: "1",
    productName: "Bamboo Laptop Stand",
    verdict: "GO",
    confidence: 78,
    date: "2026-02-15",
    category: "Office Products",
  },
  {
    id: "2",
    productName: "Silicone Kitchen Spatula Set",
    verdict: "GO",
    confidence: 85,
    date: "2026-02-12",
    category: "Home & Kitchen",
  },
  {
    id: "3",
    productName: "LED Grow Lights 1000W",
    verdict: "NO-GO",
    confidence: 72,
    date: "2026-02-10",
    category: "Garden & Outdoor",
  },
  {
    id: "4",
    productName: "Resistance Bands Set",
    verdict: "NO-GO",
    confidence: 68,
    date: "2026-02-08",
    category: "Sports & Outdoors",
  },
  {
    id: "5",
    productName: "Stainless Steel Water Bottle",
    verdict: "GO",
    confidence: 91,
    date: "2026-02-05",
    category: "Sports & Outdoors",
  },
  {
    id: "6",
    productName: "Wireless Charging Pad",
    verdict: "NO-GO",
    confidence: 56,
    date: "2026-01-28",
    category: "Electronics",
  },
]

export default function DashboardPage() {
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredAnalyses = savedAnalyses.filter((a) => {
    const matchesFilter = filter === "all" || a.verdict === filter
    const matchesSearch = a.productName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const goCount = savedAnalyses.filter((a) => a.verdict === "GO").length
  const noGoCount = savedAnalyses.filter((a) => a.verdict === "NO-GO").length

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-[1200px] px-6 py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Saved Analyses</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Review and manage your past product analyses.
              </p>
            </div>
            <Button className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" asChild>
              <Link href="/analyze">
                <Plus className="mr-2 h-4 w-4" />
                New analysis
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Analyses</span>
              <p className="mt-1 text-2xl font-bold text-card-foreground">{savedAnalyses.length}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">GO Verdicts</span>
              <p className="mt-1 text-2xl font-bold text-[#16a34a]">{goCount}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">NO-GO Verdicts</span>
              <p className="mt-1 text-2xl font-bold text-destructive">{noGoCount}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search analyses..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All verdicts</SelectItem>
                <SelectItem value="GO">GO only</SelectItem>
                <SelectItem value="NO-GO">NO-GO only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {filteredAnalyses.length > 0 ? (
            <div className="mt-6 rounded-2xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Product</TableHead>
                    <TableHead className="font-semibold">Verdict</TableHead>
                    <TableHead className="font-semibold">Confidence</TableHead>
                    <TableHead className="font-semibold hidden sm:table-cell">Category</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">Date</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnalyses.map((analysis) => (
                    <TableRow key={analysis.id}>
                      <TableCell className="font-medium text-card-foreground">{analysis.productName}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            analysis.verdict === "GO"
                              ? "bg-[#16a34a]/10 text-[#16a34a] border-[#16a34a]/20"
                              : "bg-destructive/10 text-destructive border-destructive/20"
                          }
                          variant="outline"
                        >
                          {analysis.verdict}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{analysis.confidence}%</TableCell>
                      <TableCell className="text-muted-foreground hidden sm:table-cell">{analysis.category}</TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">
                        {new Date(analysis.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" asChild>
                            <Link href="/analyze">
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span className="sr-only">Open analysis</span>
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Delete analysis</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">No analyses found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery ? "Try adjusting your search or filter." : "Run your first analysis to see it here."}
              </p>
              <Button className="mt-6 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                <Link href="/analyze">
                  <Plus className="mr-2 h-4 w-4" />
                  New analysis
                </Link>
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
