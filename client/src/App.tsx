import { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import {
  Search,
  DollarSign,
  Package,
  Truck,
  Loader2,
  Sparkles,
  LogIn,
  LogOut,
  FileText,
  Wrench,
  ChevronDown as ChevronDownIcon,
  DollarSign as DollarSignNav,
} from "lucide-react";
import { supabase, type ReportRow } from "./lib/supabase";
import { type ListingResult } from "./pages/ListingBuilder";
import { runAnalysis, type AnalysisResult } from "./integration/analysisApi";
import ListingBuilderPage from "./app/listing-builder/page";
import AnalyzeResultsPage from "./app/analyze/results/page";
import { Logo } from "./components/Logo";

const TOOLS_MENU_ITEMS: { path: string; label: string; description: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { path: "/listing-builder", label: "AI Listing Builder", description: "Generate Amazon listings & high-end visuals", Icon: Sparkles },
];

function mapReportToResult(r: ReportRow): AnalysisResult {
  const d = (r.analysis_data || {}) as Record<string, unknown>;
  const arr = (x: unknown): string[] => (Array.isArray(x) ? x.map(String) : []);
  return {
    ok: true,
    verdict: (d.verdict as "GO" | "NO_GO") ?? "NO_GO",
    score: Number(d.score) ?? 0,
    confidence: Number(d.confidence) ?? 0,
    profitAfterAds: Number(d.profit_after_ads) ?? 0,
    hasRealMarketData: Boolean(d.has_real_market_data),
    marketSnapshot: d.market_snapshot as AnalysisResult["marketSnapshot"],
    scoreBreakdown: d.score_breakdown as Record<string, string>,
    alternativeKeywords: arr(d.alternative_keywords),
    alternativeKeywordsWithCost: (d.alternative_keywords_with_cost as { keyword: string; estimatedCpc: string; estimatedCpcDisplay?: string }[]) ?? [],
    whatWouldMakeGo: arr(d.what_would_make_go),
    whyThisDecision: arr(d.why_this_decision),
    reviewIntelligence: arr(d.review_intelligence),
    marketTrends: arr(d.market_trends),
    competition: arr(d.competition),
    differentiationIdeas: arr(d.differentiation),
    advertisingReality: arr(d.advertising),
    profitabilityReality: arr(d.profitability),
    beginnerFit: arr(d.beginner_fit),
    risks: arr(d.risks),
    opportunities: arr(d.opportunities),
    executionPlan: arr(d.execution_plan),
    profitBreakdown: d.profit_breakdown as AnalysisResult["profitBreakdown"],
    profitExplanation: d.profit_explanation as string,
    sectionHelp: (d.section_help as Record<string, string>) ?? {},
    clientConfig: (d.client_config as { showDebugPanel?: boolean }) ?? {},
    estimatedMargin: typeof d.estimated_margin === "string" ? d.estimated_margin : undefined,
    financialStressTest: typeof d.financial_stress_test === "string" ? d.financial_stress_test : undefined,
    strategicIntelligence: typeof d.strategic_intelligence === "string" ? d.strategic_intelligence : undefined,
    premiumRiskWarning: typeof d.premium_risk_warning === "string" ? d.premium_risk_warning : undefined,
    marketRealityCheck: typeof d.market_reality_check === "string" ? d.market_reality_check : undefined,
    liveMarketComparison: d.live_market_comparison as AnalysisResult["liveMarketComparison"],
    marketDensity: typeof d.market_density === "string" ? d.market_density : undefined,
    acosFloorUsed: typeof d.acos_floor_used === "number" ? d.acos_floor_used : undefined,
    marginThresholdPct: typeof d.margin_threshold_pct === "number" ? d.margin_threshold_pct : undefined,
    operationalRiskBuffer: typeof d.operational_risk_buffer === "number" ? d.operational_risk_buffer : undefined,
    ppcCompetitionFloor: typeof d.ppc_competition_floor === "number" ? d.ppc_competition_floor : undefined,
    consultantSecret: typeof d.consultant_secret === "string" ? d.consultant_secret : undefined,
    launchCapitalRequired: typeof d.launch_capital_required === "number" ? d.launch_capital_required : undefined,
    launchCapitalBreakdown: d.launch_capital_breakdown as AnalysisResult["launchCapitalBreakdown"],
    launchCapitalConsultantInsight: typeof d.launch_capital_consultant_insight === "string" ? d.launch_capital_consultant_insight : undefined,
    launchAdCostPerUnit: typeof d.launch_ad_cost_per_unit === "number" ? d.launch_ad_cost_per_unit : undefined,
    differentiationScore: d.differentiation_score as AnalysisResult["differentiationScore"],
    differentiationGapTip: typeof d.differentiation_gap_tip === "string" ? d.differentiation_gap_tip : undefined,
    honeymoonRoadmap: Array.isArray(d.honeymoon_roadmap) ? d.honeymoon_roadmap.map(String) : undefined,
  };
}

function mapReportRowToListingResult(r: ReportRow): ListingResult {
  const d = (r.analysis_data || {}) as Record<string, unknown>;
  const arr = (x: unknown): string[] => (Array.isArray(x) ? x.map(String) : []);
  const layoutArr = Array.isArray(d.a_plus_layout_ideas)
    ? (d.a_plus_layout_ideas as { moduleTitle?: string; bodyText?: string; imageSuggestion?: string }[]).map((m) => ({
        moduleTitle: String(m?.moduleTitle ?? ""),
        bodyText: String(m?.bodyText ?? ""),
        imageSuggestion: String(m?.imageSuggestion ?? ""),
      }))
    : [];
  return {
    ok: true,
    copy: {
      title: (d.title as string) ?? "",
      bulletPoints: arr(d.bullet_points),
      productDescription: (d.product_description as string) ?? "",
      aPlusContentIdeas: arr(d.a_plus_content_ideas),
      aPlusLayoutIdeas: layoutArr,
    },
    imagePrompts: Array.isArray(d.image_prompts)
      ? (d.image_prompts as { type: string; prompt: string }[])
      : [],
    generatedImages: Array.isArray(d.generated_images)
      ? (d.generated_images as { type: string; prompt: string; url: string }[])
      : [],
    report: d as Record<string, unknown>,
  };
}

export default function App() {
  const [keyword, setKeyword] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [differentiation, setDifferentiation] = useState("");
  const [complexity, setComplexity] = useState<"low" | "medium" | "high">("medium");
  const [loading, setLoading] = useState(false);
  const [searchingMarketData, setSearchingMarketData] = useState(false);
  const [, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [, setSelectedReport] = useState<AnalysisResult | null>(null);
  const [, setSelectedListingReport] = useState<ListingResult | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const refetchReports = () => {
    if (!supabase || !user) return;
    setReportsLoading(true);
    supabase
      .from("reports")
      .select("id, user_id, product_name, analysis_data, created_at")
      .order("created_at", { ascending: false })
      .then(({ data, error: err }) => {
        setReports(err ? [] : (data ?? []));
        setReportsLoading(false);
      });
  };

  useEffect(() => {
    if (!supabase || !user) {
      setReports([]);
      return;
    }
    refetchReports();
  }, [user]);

  const signInWithEmail = async () => {
    if (!supabase || !authEmail.trim() || !authPassword) {
      setAuthError("נא להזין אימייל וסיסמה");
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword });
    setAuthLoading(false);
    if (error) setAuthError(error.message === "Invalid login credentials" ? "אימייל או סיסמה שגויים" : error.message);
  };

  const signUpWithEmail = async () => {
    if (!supabase || !authEmail.trim() || !authPassword) {
      setAuthError("נא להזין אימייל וסיסמה");
      return;
    }
    if (authPassword.length < 6) {
      setAuthError("סיסמה לפחות 6 תווים");
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    const { error } = await supabase.auth.signUp({ email: authEmail.trim(), password: authPassword });
    setAuthLoading(false);
    if (error) setAuthError(error.message);
    else setAuthError(null);
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSelectedReport(null);
    setSelectedListingReport(null);
  };

  const analyze = async () => {
    setLoading(true);
    setSearchingMarketData(true);
    setError(null);
    setResult(null);
    setSelectedReport(null);
    try {
      const session = supabase ? (await supabase.auth.getSession()).data.session : null;
      const result = await runAnalysis(
        {
          keyword: keyword.trim(),
          sellingPrice: Number(sellingPrice) || 0,
          unitCost: Number(unitCost) || 0,
          shippingCost: Number(shippingCost) || 0,
          differentiation: differentiation.trim() || undefined,
          complexity: complexity || undefined,
        },
        { accessToken: session?.access_token ?? undefined }
      );
      setResult(result);
      if (user && result && supabase) {
        setReportsLoading(true);
        supabase.from("reports").select("id, user_id, product_name, analysis_data, created_at").order("created_at", { ascending: false }).then(({ data: list }) => {
          setReports(list ?? []);
          setReportsLoading(false);
        });
      }
      navigate("/analyze/results", { state: { result } });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
      setSearchingMarketData(false);
    }
  };

  const showMyAnalyses = Boolean(supabase);

  const onSelectReport = (r: ReportRow) => {
    const d = (r.analysis_data || {}) as Record<string, unknown>;
    if (d.report_type === "listing") {
      setSelectedListingReport(mapReportRowToListingResult(r));
      setSelectedReport(null);
      setResult(null);
      navigate("/listing-builder");
    } else {
      setSelectedReport(mapReportToResult(r));
      setResult(null);
      setSelectedListingReport(null);
      navigate("/analyze/results", { state: { result: mapReportToResult(r) } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 text-white">
      <header className="border-b border-white/10 bg-white/5">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-h-[46px] items-center gap-5">
            <Link to="/" className="flex shrink-0 items-center py-1" aria-label="SellerMentor home">
              <Logo />
            </Link>
            {/* Main nav: Analysis | TOOLS (dropdown) | Pricing */}
            <nav className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-1">
              <Link to="/" className={`rounded-md px-3 py-2 text-sm font-medium transition flex items-center gap-1.5 ${location.pathname === "/" ? "bg-amber-500/20 text-amber-400" : "text-white/70 hover:text-white hover:bg-white/5"}`}>
                Analysis
              </Link>
              <div className="relative group overflow-visible">
                <button type="button" onClick={() => setToolsOpen((o) => !o)} onBlur={() => setTimeout(() => setToolsOpen(false), 150)} className={`rounded-md px-3 py-2 text-sm font-medium transition flex items-center gap-1.5 ${TOOLS_MENU_ITEMS.some(({ path }) => location.pathname === path) ? "bg-amber-500/20 text-amber-400" : "text-white/70 hover:text-white hover:bg-white/5"}`}>
                  <Wrench className="h-4 w-4 shrink-0" />
                  TOOLS
                  <ChevronDownIcon className={`h-4 w-4 shrink-0 transition ${toolsOpen ? "rotate-180" : ""}`} />
                </button>
                <div className={`absolute left-0 top-full z-50 mt-1.5 min-w-[260px] rounded-xl border border-white/10 bg-white/10 backdrop-blur-md py-1.5 shadow-xl transition-all duration-200 ease-out ${toolsOpen ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-[-6px] opacity-0 pointer-events-none md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-hover:pointer-events-auto"}`}>
                  {TOOLS_MENU_ITEMS.map(({ path, label, description, Icon }) => (
                    <Link key={path} to={path} onClick={() => setToolsOpen(false)} className={`flex gap-3 px-4 py-3 text-left transition rounded-lg mx-1 ${location.pathname === path ? "bg-amber-500/15 text-amber-400" : "text-white/90 hover:bg-white/10 hover:text-white"}`}>
                      <Icon className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{label}</div>
                        <div className="text-xs text-white/50 mt-0.5">{description}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              <Link to="/pricing" className={`rounded-md px-3 py-2 text-sm font-medium transition flex items-center gap-1.5 ${location.pathname === "/pricing" ? "bg-amber-500/20 text-amber-400" : "text-white/70 hover:text-white hover:bg-white/5"}`}>
                <DollarSignNav className="h-4 w-4" />
                Pricing
              </Link>
            </nav>
          </div>
          {showMyAnalyses && (
            <div className="flex flex-col items-end gap-3">
              {user ? (
                <>
                  <span className="text-sm text-white/70 truncate max-w-[200px]">{user.email}</span>
                  <button
                    type="button"
                    onClick={signOut}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => { setShowEmailAuth(!showEmailAuth); setAuthError(null); }}
                    className="inline-flex items-center gap-2 rounded-lg bg-white text-slate-900 px-4 py-2 text-sm font-semibold hover:bg-white/90"
                  >
                    <LogIn className="h-4 w-4" />
                    {showEmailAuth ? "סגור" : "כניסה / הרשמה"}
                  </button>
                  {showEmailAuth && (
                    <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3 min-w-[260px]">
                      <input
                        type="email"
                        placeholder="אימייל"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:border-amber-500/50 focus:outline-none"
                      />
                      <input
                        type="password"
                        placeholder="סיסמה"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:border-amber-500/50 focus:outline-none"
                      />
                      {authError && <p className="text-sm text-red-400">{authError}</p>}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={signInWithEmail}
                          disabled={authLoading}
                          className="flex-1 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-amber-400 disabled:opacity-60"
                        >
                          {authLoading ? "..." : "כניסה"}
                        </button>
                        <button
                          type="button"
                          onClick={signUpWithEmail}
                          disabled={authLoading}
                          className="flex-1 rounded-lg border border-white/20 px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10 disabled:opacity-60"
                        >
                          הרשמה
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {showMyAnalyses && (
          <section className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <FileText className="h-5 w-5 text-amber-500" />
              My Analyses
            </h2>
            {!user ? (
              <p className="text-sm text-white/60">התחבר כדי לשמור ולצפות בניתוחים שלך.</p>
            ) : reportsLoading ? (
              <div className="flex items-center gap-2 text-white/60">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading…</span>
              </div>
            ) : reports.length === 0 ? (
              <p className="text-white/80">
                Start your first analysis — run one above and it will be saved here.
              </p>
            ) : (
              <ul className="space-y-2">
                {reports.map((r) => {
                  const data = r.analysis_data as Record<string, unknown>;
                  const verdict = (data?.verdict as string) ?? "—";
                  const score = typeof data?.score === "number" ? data.score : "—";
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => onSelectReport(r)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
                      >
                        <span className="font-medium text-white">{r.product_name}</span>
                        <span className="ml-2 text-sm text-white/60">
                          {(data?.report_type as string) === "listing"
                            ? "Listing"
                            : `${verdict} · ${score}/100`}{" "}
                          · {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        <Routes>
          <Route
            path="/"
            element={
              <>
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-white/70">
                Keyword / Product
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder=""
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-white placeholder-white/40 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-white/70">
                Selling Price ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-white focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                />
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-white/70">
                Unit Cost ($)
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  type="number"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-white focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-white/70">
                Shipping Cost ($)
              </label>
              <div className="relative">
                <Truck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  type="number"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-white focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">
              Q5 — Differentiation (how you stand out)
            </label>
            <textarea
              value={differentiation}
              onChange={(e) => setDifferentiation(e.target.value)}
              placeholder="e.g. Organic materials, removable washable cover, vet-recommended"
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/40 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">
              Q6 — Product complexity
            </label>
            <select
              value={complexity}
              onChange={(e) => setComplexity(e.target.value as "low" | "medium" | "high")}
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-4 pr-4 text-white focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            >
              <option value="low" className="bg-slate-900 text-white">Low</option>
              <option value="medium" className="bg-slate-900 text-white">Medium</option>
              <option value="high" className="bg-slate-900 text-white">High (margin requirement 20%)</option>
            </select>
          </div>
          <button
            onClick={analyze}
            disabled={loading}
            className="flex w-full flex-col items-center justify-center gap-1 rounded-xl bg-amber-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {searchingMarketData ? "Searching market data…" : "Analyzing…"}
                </span>
                {searchingMarketData && <span className="text-xs font-normal opacity-90">Fetching top competitors &amp; live pricing</span>}
              </>
            ) : (
              <>
                <span className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Analyze Product
                </span>
                <span className="text-xs font-normal opacity-90">Live Intelligence Mode — real-time market data</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

              </>
            }
          />
          <Route path="/analyze/results" element={<AnalyzeResultsPage />} />
          <Route
            path="/pricing"
            element={
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                <h2 className="mb-2 text-xl font-semibold text-white">Pricing</h2>
                <p className="text-white/60">Pricing plans coming soon.</p>
              </div>
            }
          />
          <Route path="/listing-generator" element={<Navigate to="/listing-builder" replace />} />
          <Route
            path="/listing-builder"
            element={<ListingBuilderPage />}
          />
        </Routes>
      </main>
    </div>
  );
}
