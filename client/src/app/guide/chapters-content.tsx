import type { ReactNode } from "react"

export interface ChapterMeta {
  num: number
  slug: string
  title: string
  subtitle: string
  progress: number
  prevSlug: string | null
  prevTitle: string | null
  nextSlug: string | null
  nextTitle: string | null
  content: ReactNode
}

// ── Shared sub-components (inline) ──────────────────────────────────
function Callout({ children }: { children: ReactNode }) {
  return <div className="guide-callout"><p>{children}</p></div>
}
function CaseStudy({ children }: { children: ReactNode }) {
  return <div className="guide-case-study"><p>{children}</p></div>
}

// ── Chapter data ─────────────────────────────────────────────────────
export const CHAPTERS_DATA: ChapterMeta[] = [
  // ── 1 ──────────────────────────────────────────────────────────────
  {
    num: 1, slug: "chapter-1",
    title: "How Amazon FBA Works",
    subtitle: "Fees, flow, account setup — and what Amazon actually handles for you.",
    progress: 11,
    prevSlug: null, prevTitle: null,
    nextSlug: "chapter-2", nextTitle: "Finances & Profit Math",
    content: (
      <div className="guide-prose">
        <p>Fulfillment by Amazon (FBA) is a service where Amazon stores your products in its warehouses, picks and packs each order, ships it to customers, and handles returns. You focus on sourcing and marketing. Amazon does everything else.</p>
        <p>In 2026, FBA remains the dominant fulfillment method for private label sellers — not because it&apos;s the cheapest, but because it gives you the Prime badge, fast shipping, and Amazon&apos;s customer trust from day one.</p>
        <h2>The Flow, Step by Step</h2>
        <ol>
          <li>You source a product (usually from China via Alibaba or a local supplier).</li>
          <li>You ship units to an Amazon fulfillment center — not to your home.</li>
          <li>A customer finds your listing and orders.</li>
          <li>Amazon picks, packs, and ships within 1–2 days.</li>
          <li>Amazon deposits your proceeds (minus fees) every 2 weeks.</li>
        </ol>
        <h2>What FBA Costs You</h2>
        <ul>
          <li><strong>Referral fee</strong> — 8–15% of the sale price depending on category.</li>
          <li><strong>FBA fulfillment fee</strong> — per unit shipped. A standard-size item under 1 lb was ~$3.86 in early 2026.</li>
          <li><strong>Monthly storage fee</strong> — $0.78/cubic foot standard size (Jan–Sep).</li>
          <li><strong>Long-term storage fee</strong> — for inventory sitting over 365 days.</li>
        </ul>
        <Callout>⚠️ <strong>Common mistake:</strong> New sellers forget FBA fulfillment fees, inbound shipping, and storage. Your real cost is always higher than you think — calculate every line.</Callout>
        <h2>FBA vs. FBM</h2>
        <p>FBM (Fulfilled by Merchant) ships from your location — lower fees, but no Prime badge and you handle every return. Most private label brands use FBA for the main ASIN and FBM as a stockout backup.</p>
        <h2>What Amazon Does NOT Do</h2>
        <ul>
          <li>Find your product or negotiate with suppliers</li>
          <li>Create your listing or take your photos</li>
          <li>Run your PPC campaigns or get you reviews</li>
          <li>Protect you from copycats or hijackers</li>
        </ul>
        <h2>Account Setup Checklist</h2>
        <ul>
          <li>Register at <strong>sellercentral.amazon.com</strong> — Individual ($0.99/sale) or Professional ($39.99/mo). Use Pro if you&apos;ll sell 40+ units/month.</li>
          <li>Submit ID, bank account, and tax info. Approval takes 1–3 business days in 2026.</li>
          <li>Enable 2-factor authentication immediately.</li>
          <li>Set up disbursement to a US bank (Wise works for non-US sellers).</li>
          <li><strong>Identity Verification:</strong> Prepare a high-quality scan of your Passport and a Utility Bill (electricity, water, or internet) that matches your registration name and address exactly. Amazon is extremely strict — a single letter difference between your ID and your bill can cause weeks of delays.</li>
        </ul>
        <CaseStudy>🟢 <strong>Real example:</strong> A seller launched a silicone utensil set in Q1 2026 at $28.99. FBA fee + referral: $7.40. COGS + inbound shipping: $6.80. Net before ads: ~$14.79/unit (51% margin). After ~$3/unit PPC at launch, netted $11.79 — strong enough to scale confidently.</CaseStudy>
      </div>
    ),
  },

  // ── 2 ──────────────────────────────────────────────────────────────
  {
    num: 2, slug: "chapter-2",
    title: "Finances & Profit Math",
    subtitle: "The exact numbers you must know before ordering a single unit.",
    progress: 22,
    prevSlug: "chapter-1", prevTitle: "How Amazon FBA Works",
    nextSlug: "chapter-3", nextTitle: "Product Research",
    content: (
      <div className="guide-prose">
        <p>This is the chapter most new sellers skim — and then wonder why they&apos;re not making money six months later. The math is not complicated, but you have to do it honestly, including every cost.</p>
        <h2>The Full Cost Stack</h2>
        <ul>
          <li><strong>COGS</strong> — cost per unit from your supplier</li>
          <li><strong>Inbound shipping</strong> — the cost to move your goods from the factory to Amazon&apos;s warehouse. Depending on sea or air freight, this typically adds <strong>$1.00–$3.00 per unit</strong>. Never calculate profit based solely on the manufacturing price.</li>
          <li><strong>Amazon referral fee</strong> — 8–15% of selling price</li>
          <li><strong>FBA fulfillment fee</strong> — varies by weight/size; check Seller Central</li>
          <li><strong>Storage fee</strong> — monthly, cubic feet. Estimate 1–2 months of stock.</li>
          <li><strong>PPC spend</strong> — ad cost per unit sold</li>
          <li><strong>Photography &amp; design</strong> — amortize one-time costs over first 100 units</li>
          <li><strong>Returns &amp; damaged</strong> — budget 2–4% of revenue</li>
        </ul>
        <h2>The Formula</h2>
        <p><strong>Net Profit/Unit</strong> = Price − COGS − Inbound − Referral − FBA Fee − Storage − PPC − Returns</p>
        <p><strong>Net Margin %</strong> = Net Profit ÷ Price × 100</p>
        <p>Target <strong>25–30% minimum net margin</strong> before committing. Below 20%, you have no buffer for a price drop, fee increase, or bad PPC month.</p>
        <Callout>⚠️ Amazon adjusts FBA fees at least once a year (usually January). Always verify the current fee table in Seller Central — fees that were $3.22/unit in 2024 were $3.86+ by early 2026 for some size tiers.</Callout>
        <h2>Cash Flow vs. Profit</h2>
        <p>Profit on paper and cash in your account are different things. You pay for inventory weeks before Amazon pays you. Most growing FBA businesses are cash-flow negative even when profitable. Model when you pay the supplier, when inventory lands, when Amazon disburses — and plan for the gap.</p>
        <h2>Break-Even Volume</h2>
        <p>If your total launch cost is $3,000 and your net profit per unit is $8, you need to sell 375 units before you&apos;ve recovered that money. Does your estimated demand support that timeline?</p>
        <CaseStudy>🟢 <strong>Real example:</strong> A seller launched a $24.99 yoga block set. Referral: $3.75. FBA fee: $4.10. COGS + shipping: $5.20. PPC: $3.00. Net: $8.94/unit (35.8%). Ordered 400 units, needed 233 to break even — hit it in 38 days.</CaseStudy>
      </div>
    ),
  },

  // ── 3 ──────────────────────────────────────────────────────────────
  {
    num: 3, slug: "chapter-3",
    title: "Product Research",
    subtitle: "How to find the right niche — demand, competition, and margin filters.",
    progress: 33,
    prevSlug: "chapter-2", prevTitle: "Finances & Profit Math",
    nextSlug: "chapter-4", nextTitle: "Suppliers & Sourcing",
    content: (
      <div className="guide-prose">
        <p>Product research is where most new sellers spend too much time — or not enough. The goal is simple: find a product with enough demand, manageable competition, and margins that survive fees, ads, and the unexpected.</p>
        <h2>The 3 Filters That Matter</h2>
        <h3>1. Demand</h3>
        <p>Use Helium 10 or Jungle Scout to check monthly search volume. A minimum of <strong>3,000–5,000 searches/month</strong> is a reasonable floor. Check the BSR of the top 10 results — a BSR of 1,000–10,000 in most categories suggests consistent daily sales.</p>
        <h3>2. Competition</h3>
        <p>Count how many of the top 10 results have <strong>under 200 reviews</strong>. If the whole page is dominated by listings with 2,000+ reviews, you need a year just to catch up. A healthy opportunity has at least 3–4 top results with fewer than 200 reviews.</p>
        <h3>3. Margin</h3>
        <p>Run a rough profit check using what you learned in Chapter 2. Target price minus all costs should leave you at least <strong>25–30% net margin before PPC</strong>. Below that, advertising will eat you alive.</p>
        <Callout>⚠️ Never fall in love with a product before checking the numbers. The most common mistake is finding something you personally like, assuming the margin works, and ordering 500 units. Check the math first.</Callout>
        <h2>Categories to Consider in 2026</h2>
        <ul>
          <li><strong>Home &amp; Kitchen</strong> — high volume, competitive, but huge subcategory diversity. Good for new sellers who find a specific niche.</li>
          <li><strong>Pet Supplies</strong> — growing year-over-year, strong repeat purchase potential.</li>
          <li><strong>Sports &amp; Outdoors</strong> — seasonal. Watch inventory timing. Strong Q2/Q3 windows.</li>
        </ul>
        <p>Avoid as a beginner: Electronics (returns kill margins), Grocery (compliance heavy), Clothing/Shoes (size returns are brutal).</p>
        <h2>Red Flags</h2>
        <ul>
          <li>Amazon sells the same product under Amazon Basics</li>
          <li>All top sellers have 5,000+ reviews</li>
          <li>Price has been falling over the past 12 months (check Keepa)</li>
          <li>Fragile, hazmat, or oversize — fees and breakage spike</li>
          <li><strong>High Seasonality:</strong> Check the 12-month demand trend on Google Trends or Helium 10. A product that looks amazing in July (e.g., beach gear) can become a &quot;cash graveyard&quot; in January. Aim for products with consistent year-round demand for your first launch.</li>
        </ul>
        <CaseStudy>🟢 <strong>Real example:</strong> In early 2026, a seller found &quot;travel pill organizer with humidity indicator&quot; — 4,400 monthly searches, top 5 had 40–180 reviews, selling at $18–22. COGS: $2.80. After fees and ads, net margin: 34%. Launched with 300 units, hit 40 sales/day within 60 days.</CaseStudy>
      </div>
    ),
  },

  // ── 4 ──────────────────────────────────────────────────────────────
  {
    num: 4, slug: "chapter-4",
    title: "Suppliers & Sourcing",
    subtitle: "Manufacturing, MOQ negotiation, QC, and getting inventory to Amazon.",
    progress: 44,
    prevSlug: "chapter-3", prevTitle: "Product Research",
    nextSlug: "chapter-5", nextTitle: "Listing Optimization",
    content: (
      <div className="guide-prose">
        <p>Sourcing is the part that separates sellers who last from those who don&apos;t. Finding a cheap supplier is easy. Finding one who delivers consistent quality, meets deadlines, and communicates clearly takes more effort.</p>
        <h2>Where Most Sellers Source</h2>
        <p><strong>Alibaba</strong> — primary platform for Chinese manufacturers in 2026. Filter for &quot;Verified Supplier&quot; and &quot;Gold Supplier.&quot; <strong>1688.com</strong> is cheaper but needs a sourcing agent if you don&apos;t speak Mandarin. <strong>US-based wholesalers</strong> work for &quot;Made in USA&quot; niches but COGS is 3–5x higher.</p>
        <h2>How to Reach Out</h2>
        <p>Contact 5–8 suppliers per product with clear specs, target quantity, packaging requirements, and timeline. Suppliers ignore vague messages. Narrow to 2–3 who respond promptly. Order samples from all of them before committing to a production run.</p>
        <h2>Negotiating MOQ</h2>
        <p>MOQ for most small products from China is 100–500 units. Try to negotiate down to 200–300 for your first order — most suppliers agree for a small per-unit premium. Your second order (if the product sells) gives you leverage for a better rate.</p>
        <Callout>⚠️ Never pay 100% upfront. Standard terms: 30% deposit, 70% before shipment. Use Alibaba Trade Assurance on your first few orders for dispute protection if the product doesn&apos;t match the sample.</Callout>
        <h2>Quality Control</h2>
        <p>For orders over $2,000, hire a third-party QC inspection service (QIMA, AsiaInspection). They visit the factory before shipment, check a sample against your specs, and send a report. Costs $200–300. Worth every dollar.</p>
        <h2>2026 Tariff Note</h2>
        <p>US tariffs on goods from China remain elevated. Check your product&apos;s HS code tariff rate before finalizing margins — some categories carry 25%+ duties. Vietnam, India, and Mexico have become common alternatives for tariff-sensitive products.</p>
        <ul>
          <li><strong>HS Code Precision:</strong> Ask your supplier for the specific HS Code of your product. Use it to check the exact duty rate on the US International Trade Commission website (usitc.gov). Don&apos;t guess the 25% tariff — know it before you wire the 30% deposit.</li>
          <li><strong>Shipping Terms:</strong> Ask for a <strong>DDP (Delivered Duty Paid)</strong> quote. This ensures the shipping price includes all customs and duties, preventing unexpected $1,000+ bills at the border.</li>
        </ul>
        <CaseStudy>🟢 <strong>Real example:</strong> A seller sourcing a bamboo cutting board set got quotes from 6 suppliers. One stood out with detailed specs and fast samples. The QC inspection caught loose handles before shipment — supplier fixed it. The seller avoided a wave of 1-star reviews on launch day.</CaseStudy>
      </div>
    ),
  },

  // ── 5 ──────────────────────────────────────────────────────────────
  {
    num: 5, slug: "chapter-5",
    title: "Listing Optimization",
    subtitle: "Writing to convert — title, bullets, images, and A+ content.",
    progress: 55,
    prevSlug: "chapter-4", prevTitle: "Suppliers & Sourcing",
    nextSlug: "chapter-6", nextTitle: "Brand Building & Protection",
    content: (
      <div className="guide-prose">
        <p>Your listing is your storefront, your sales page, and your SEO strategy all in one. A good product with a bad listing will fail. A decent product with an excellent listing can outperform competitors on day one.</p>
        <h2>The Title</h2>
        <p>The single most important SEO element. Include: primary keyword, secondary keyword, key benefit, and brand name. Keep it under 200 characters and readable — Amazon penalizes keyword stuffing.</p>
        <p><strong>Example:</strong> &quot;BambooBliss Cutting Board Set — Non-Slip Bamboo Chopping Boards with Juice Groove, 3-Piece, Dishwasher Safe&quot;</p>
        <h2>Bullet Points</h2>
        <p>Five bullets, each leading with a customer benefit — not a product feature.</p>
        <ul>
          <li>❌ &quot;Made from premium bamboo&quot;</li>
          <li>✅ &quot;Stays intact after 200+ washes — resists warping, cracking, and odor absorption&quot;</li>
        </ul>
        <h2>Images</h2>
        <p>Main image: white background, product only, 85%+ of frame. Images 2–7: product in use, close-ups, size comparison, lifestyle, feature infographic. In 2026, video in the main carousel (for Brand Registered sellers) measurably increases conversion rate.</p>
        <p><strong>The Main Image Rule:</strong> Your main image must have a pure white background (RGB 255, 255, 255). If the background is even slightly grey or off-white, Amazon&apos;s automated system may suppress your listing within minutes of going live — with no warning notification sent to you.</p>
        <h2>A+ Content</h2>
        <p>Brand Registered sellers only. Replaces the plain description with rich content — comparison tables, lifestyle images, feature callouts. Consistently increases conversion by 3–10%.</p>
        <h2>Backend Keywords</h2>
        <p>250 bytes of hidden keywords. Fill every byte. No repeats. Use Helium 10 Magnet to find terms competitors rank for that didn&apos;t fit in your title or bullets.</p>
        <Callout>⚠️ Do not launch with a placeholder listing. A bad listing in the first 30 days hurts organic rank in ways that take months to recover. Get photos, copy, and A+ done before your inventory arrives.</Callout>
        <CaseStudy>🟢 <strong>Real example:</strong> A seller launched a silicone baking mat with a 7% CVR. After updating the title, replacing 3 images with lifestyle shots, and adding A+ content, CVR jumped to 18% within 3 weeks. Same traffic — 2.5x the revenue.</CaseStudy>
      </div>
    ),
  },

  // ── 6 ──────────────────────────────────────────────────────────────
  {
    num: 6, slug: "chapter-6",
    title: "Brand Building & Protection",
    subtitle: "Trademarks, Brand Registry, and insurance — set this up before you launch.",
    progress: 66,
    prevSlug: "chapter-5", prevTitle: "Listing Optimization",
    nextSlug: "chapter-7", nextTitle: "Launch Strategy",
    content: (
      <div className="guide-prose">
        <p>Most new sellers treat brand building as optional. It isn&apos;t. Without Brand Registry you can&apos;t use A+ Content, can&apos;t run Sponsored Brands, can&apos;t access Vine, and can&apos;t take down hijackers. Start the trademark process early — it takes 8–14 months in the US.</p>
        <h2>Trademark First</h2>
        <p>File with the USPTO as soon as you&apos;ve decided on your brand name. Cost: ~$250–350/class through the TEAS system, or ~$1,000–1,500 with an IP attorney (recommended). Once your application is filed — not approved — you can apply for Amazon&apos;s <strong>IP Accelerator program</strong> to get Brand Registry access while still pending.</p>
        <h2>Brand Registry Benefits</h2>
        <ul>
          <li><strong>A+ Content</strong> — richer listing pages with images and comparison modules</li>
          <li><strong>Sponsored Brands</strong> — branded banner ads in search results</li>
          <li><strong>Amazon Vine</strong> — early review program ($200/ASIN in 2026)</li>
          <li><strong>Brand Analytics</strong> — search term data, competitor insights</li>
          <li><strong>Project Zero &amp; Transparency</strong> — tools to fight counterfeits</li>
          <li><strong>Amazon Storefront</strong> — a branded multi-page storefront</li>
        </ul>
        <h2>Protecting Against Hijackers</h2>
        <p>A hijacker adds their counterfeit product to your listing and undercuts your price. With Brand Registry, Amazon typically removes them within 24–48 hours. Without it, you&apos;re largely helpless. The <strong>Transparency program</strong> ($0.01–0.05/unit) puts unique QR codes on every unit — Amazon scans them before shipping. Eliminates hijacking entirely.</p>
        <h2>Product Insurance — Don&apos;t Skip This</h2>
        <p>Amazon requires general liability insurance once you hit $10,000/month in sales. Get it early. <strong>Hiscox, State Farm, and Next Insurance</strong> all have FBA-specific options. Costs $400–900/year. If your product injures a customer and you&apos;re uninsured, you&apos;re personally liable.</p>
        <Callout>⚠️ <strong>Critical timing:</strong> Get Brand Registry and insurance sorted before your launch day — you need A+ Content and Vine active from week one to maximize velocity during the honeymoon period.</Callout>
        <CaseStudy>🟢 <strong>Real example:</strong> A seller with $35K/month had a competitor file a fraudulent IP complaint. Listing suspended 11 days. No email list, no website — zero revenue for 11 days. They&apos;ve since built a 4,000-person email list and Shopify store generating 12% of revenue. It paid for itself on the next suspension.</CaseStudy>
      </div>
    ),
  },

  // ── 7 ──────────────────────────────────────────────────────────────
  {
    num: 7, slug: "chapter-7",
    title: "Launch Strategy",
    subtitle: "The first 30 days playbook — reviews, rank, and velocity.",
    progress: 77,
    prevSlug: "chapter-6", prevTitle: "Brand Building & Protection",
    nextSlug: "chapter-8", nextTitle: "PPC Advertising",
    content: (
      <div className="guide-prose">
        <p>The first 30 days after going live are disproportionately important. Amazon&apos;s algorithm rewards new listings that demonstrate velocity — units sold, conversion rate, and reviews in rapid succession. A slow start is hard to recover from.</p>
        <h2>Pre-Launch Checklist</h2>
        <ul>
          <li>Listing fully optimized (Chapter 5)</li>
          <li>Brand Registry active, A+ Content live (Chapter 6)</li>
          <li>Inventory checked in at the FC</li>
          <li>PPC campaign built and ready (Chapter 8)</li>
          <li>Price set within 5% of top 3 competitors</li>
        </ul>
        <h2>Getting Your First Reviews</h2>
        <ul>
          <li><strong>Amazon Vine</strong> — enroll up to 30 units. $200/ASIN. Yields 10–20 reviews in 4–6 weeks. Cleanest, fastest legitimate path.</li>
          <li><strong>&quot;Request a Review&quot; button</strong> — use on every order, every day. Automate with FeedbackWhiz or Helium 10 Follow-Up.</li>
          <li><strong>Product insert</strong> — card directing customers to register their purchase. No mention of reviews. No incentives.</li>
        </ul>
        <h2>The Honeymoon Period</h2>
        <p>Amazon gives new ASINs preferential placement for 2–4 weeks to gather data. During this window, spend more on PPC than you would long-term. You&apos;re buying rank and data — not profit yet.</p>
        <p><strong>Use Coupons, Not Just Discounts:</strong> Instead of only lowering your price, activate a <strong>Green Coupon Badge</strong> in Seller Central. It stands out visually in search results and increases Click-Through Rate (CTR) far more effectively than a simple price drop. It also protects your Price Anchor — allowing you to raise your price later without losing the Buy Box or training customers to expect a discount.</p>
        <Callout>⚠️ Don&apos;t discount too aggressively. A $9.99 price on a $24.99 product trains customers to expect low prices and damages perceived value. A 10–15% launch discount is enough.</Callout>
        <h2>What to Watch in Week 1</h2>
        <ul>
          <li><strong>Impressions</strong> — are your ads appearing?</li>
          <li><strong>CTR</strong> — is your main image compelling?</li>
          <li><strong>CVR</strong> — are visitors buying?</li>
          <li><strong>BSR</strong> — is rank improving?</li>
        </ul>
        <CaseStudy>🟢 <strong>Real example:</strong> A seller launched a pet water fountain in January 2026. Enrolled in Vine (14 reviews, 4.4 avg). Spent $800 on PPC in week 1. Hit 22 organic sales/day by day 21. Day 30: 78 reviews, BSR 1,200 in Pet Supplies. ACoS dropped from 55% to 28% as organic rank took over.</CaseStudy>
      </div>
    ),
  },

  // ── 8 ──────────────────────────────────────────────────────────────
  {
    num: 8, slug: "chapter-8",
    title: "PPC Advertising",
    subtitle: "Buying data and traffic — how to set up, budget, and not lose money.",
    progress: 88,
    prevSlug: "chapter-7", prevTitle: "Launch Strategy",
    nextSlug: "chapter-9", nextTitle: "Scaling & Next Steps",
    content: (
      <div className="guide-prose">
        <p>PPC on Amazon is not optional. Even great listings need ad spend to get visible in a competitive market. But without structure, PPC will silently consume your margins.</p>
        <h2>The Three Campaign Types</h2>
        <ul>
          <li><strong>Sponsored Products</strong> — ads in search results and product pages. The most important type. Start here.</li>
          <li><strong>Sponsored Brands</strong> — banner ads at the top of search. Requires Brand Registry. Use after launch once you have reviews.</li>
          <li><strong>Sponsored Display</strong> — retargeting. More advanced. Not a launch priority.</li>
        </ul>
        <h2>Launch Campaign Structure</h2>
        <ol>
          <li><strong>Auto campaign</strong> — Amazon selects keywords. $20–30/day budget. Run 2 weeks to discover converting terms.</li>
          <li><strong>Manual exact match</strong> — target your 5–10 best keywords. Bid competitively. This gives you control and data.</li>
        </ol>
        <h2>ACoS and TACoS</h2>
        <p><strong>ACoS</strong> = ad spend ÷ ad revenue. A 30% ACoS = $30 spent to generate $100 in ad sales. Your break-even ACoS ≈ your net margin before ads.</p>
        <p><strong>TACoS</strong> = ad spend ÷ total revenue (including organic). This is the metric that actually matters long-term. A mature, healthy product should have TACoS under 10–12%.</p>
        <Callout>⚠️ During launch, ACoS will be 50–80%. This is normal. You&apos;re buying rank and data — not profit. ACoS improves as reviews accumulate and organic rank rises. Don&apos;t panic and cut spend in week 1.</Callout>
        <h2>Keyword Harvesting</h2>
        <p>After 2 weeks, download your Auto campaign search term report. Move converting keywords to your Manual exact match campaign. Negate terms that spent without converting. Repeat every 2 weeks.</p>
        <p><strong>Negative Keywords — Start on Day One:</strong> Identify and add Negative Keywords immediately. If you sell a &quot;Premium Bamboo Board,&quot; add &quot;Plastic&quot; and &quot;Cheap&quot; as negative terms from day one. This prevents Amazon from showing your ad to shoppers who will never buy your product — saving you hundreds of dollars in wasted clicks before you even notice the pattern.</p>
        <CaseStudy>🟢 <strong>Real example:</strong> A seller launched an insulated tumbler in March 2026. Auto ACoS: 68% in week 1. After harvesting 12 converting keywords to manual exact match, ACoS dropped to 31% by week 6. TACoS hit 9% by month 3. Total ad spend in 90 days: $2,400. Revenue: $18,700.</CaseStudy>
      </div>
    ),
  },

  // ── 9 ──────────────────────────────────────────────────────────────
  {
    num: 9, slug: "chapter-9",
    title: "Scaling & Next Steps",
    subtitle: "Avoid the out-of-stock trap, add SKUs, and build long-term equity.",
    progress: 100,
    prevSlug: "chapter-8", prevTitle: "PPC Advertising",
    nextSlug: null, nextTitle: null,
    content: (
      <div className="guide-prose">
        <p>Getting to $5K/month is a milestone. Getting to $50K/month requires a different mindset. Scaling well means knowing when to go deeper (more inventory, better rank) vs. wider (new SKUs, new markets).</p>
        <h2>Avoid the Out-of-Stock Trap</h2>
        <p>Running out of stock resets your organic rank — one of the most expensive mistakes a growing seller makes. Set your reorder point based on lead time. If it takes 45 days from order to Amazon and you sell 30 units/day, you need 1,350+ units in stock when you reorder, plus a safety buffer. Use Amazon&apos;s Inventory Dashboard and set alerts below 60 days of cover for bestsellers.</p>
        <h2>When to Add a New SKU</h2>
        <p>Only when your existing product is stable — consistent daily sales, ACoS under control, reviews accumulating. Don&apos;t launch two products simultaneously. <strong>Rule:</strong> don&apos;t launch a second SKU until your first hits $8K–10K/month with positive cash flow.</p>
        <h2>Product Line Expansion</h2>
        <p>The highest-leverage expansion is a complementary product — same customer, same keyword ecosystem, bundle potential. Bundling two products into one ASIN increases average order value and reduces competition (nobody else has your exact bundle).</p>
        <h2>International Expansion</h2>
        <p>Once you&apos;ve mastered the US, Canada is the easiest next step — same language, similar behavior. UK and EU require VAT registration. Don&apos;t rush international — fix the US operation first.</p>
        <p><strong>The NARF Advantage:</strong> Once your US listing is stable, use the <strong>Remote Fulfillment (NARF)</strong> program to test Canada and Mexico. This allows you to sell to those markets using your existing US inventory — without the complexity of international shipping, separate FBA shipments, or separate tax registrations. It&apos;s the lowest-risk way to validate international demand before fully committing.</p>
        <Callout>💡 <strong>Think about your exit from day one.</strong> FBA businesses sell for 2–4x annual profit. Build clean books, a defensible brand, and diversified traffic — and you have a sellable asset. Use Empire Flippers or FE International to understand what buyers value.</Callout>
        <h2>What a $50K/Month Business Looks Like</h2>
        <ul>
          <li>3–8 SKUs, all profitable, all Brand Registered</li>
          <li>Trademark filed or approved</li>
          <li>Clear reorder system and supplier relationships</li>
          <li>PPC on a weekly optimization cycle</li>
          <li>Off-Amazon presence (email list, DTC site, or social)</li>
          <li>Clean P&amp;L with A2X + QuickBooks or Xero</li>
        </ul>
        <CaseStudy>🟢 <strong>Real example:</strong> A seller started with one kitchen product in mid-2024. By Q1 2026: 5 SKUs, $52K/month, 31% net margin. Sold the business in March 2026 for $520,000 — 2.6x annual profit. Buyer valued the trademark, Brand Registry, and supplier contracts as key assets beyond the revenue numbers.</CaseStudy>
      </div>
    ),
  },
]

export function getChapter(slug: string): ChapterMeta | undefined {
  return CHAPTERS_DATA.find((ch) => ch.slug === slug)
}
