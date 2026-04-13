import React from "react"

export type ContentBlock =
  | { type: "h2"; id: string; text: string }
  | { type: "h3"; id: string; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "callout"; variant: "tip" | "warning" | "stat"; title: string; text: string }
  | { type: "cta"; title: string; text: string; buttonText: string; buttonHref: string }
  | { type: "divider" }
  | { type: "takeaways"; items: string[] }

export type BlogPost = {
  slug: string
  title: string
  excerpt: string
  category: string
  categoryColor: string
  readTime: number
  publishedAt: string
  coverImage: string
  featured: boolean
  tags: string[]
  tocItems: { id: string; text: string; level: number }[]
  content: ContentBlock[]
}

export const POSTS: BlogPost[] = [
  // ─────────────────────────────────────────────────────────────────────
  // POST 1: Product Validation
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: "how-to-validate-amazon-product-2026",
    title: "How to Validate an Amazon Product in 2026 (The 4-Signal Method That Saves $5,000)",
    excerpt: "3 out of 5 new Amazon sellers lose money on their first product — not from bad suppliers or weak listings, but from skipping validation. Here's the exact framework that separates GO from NO-GO before you spend a dollar.",
    category: "Product Research",
    categoryColor: "bg-blue-50 text-blue-700 border-blue-100",
    readTime: 8,
    publishedAt: "2026-03-28",
    coverImage: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=1200&q=80",
    featured: true,
    tags: ["product research", "amazon fba", "product validation", "go no-go"],
    tocItems: [
      { id: "the-real-reason", text: "The Real Reason Most First Products Fail", level: 2 },
      { id: "signal-1", text: "Signal 1: Real Demand", level: 2 },
      { id: "signal-2", text: "Signal 2: Winnable Competition", level: 2 },
      { id: "signal-3", text: "Signal 3: Healthy Margin", level: 2 },
      { id: "signal-4", text: "Signal 4: Your Differentiation Angle", level: 2 },
      { id: "the-decision", text: "The GO / NO-GO Decision Framework", level: 2 },
      { id: "mistakes", text: "3 Mistakes That Kill Good Products", level: 2 },
    ],
    content: [
      {
        type: "takeaways",
        items: [
          "3 out of 5 new sellers lose money on their first product — almost always from skipping validation.",
          "You need all 4 signals to be green. One red = NO-GO, no exceptions.",
          "High demand alone is not enough. Unwinnable competition kills high-demand products daily.",
          "Run the margin math before you ever talk to a supplier. Most sellers do it backwards.",
        ],
      },
      {
        type: "h2", id: "the-real-reason",
        text: "The Real Reason Most First Products Fail",
      },
      {
        type: "p",
        text: "In 2025, 3 out of 5 new Amazon sellers lost money on their first product. Not because of bad suppliers. Not because of their listing copy. Not because of competition from China. Because they picked the wrong product — and didn't find out until $5,000 to $15,000 was already gone.",
      },
      {
        type: "p",
        text: "The painful truth: that money was lost in the research phase, before a single unit was ordered. The product was doomed before it launched. And the worst part? Every single one of those failed products would have failed a proper 4-signal validation check.",
      },
      {
        type: "callout",
        variant: "stat",
        title: "The Numbers Don't Lie",
        text: "The average first-time FBA seller who skips validation loses $4,200 on their first product. The average seller who runs a proper GO/NO-GO framework before ordering? They don't make the news — because they're too busy running a profitable business.",
      },
      {
        type: "p",
        text: "Product validation isn't a nice-to-have. It's the difference between building a business and paying tuition to Amazon. Here are the 4 signals you need to check — in order — before you move forward with any product idea.",
      },
      {
        type: "h2", id: "signal-1",
        text: "Signal 1: Real Demand",
      },
      {
        type: "p",
        text: "Demand means people are actively searching for this product on Amazon right now and buying it consistently — not once a year, not seasonally as a one-off, and not just on Google. Amazon demand and Google interest are two completely different things. Millions of people Google 'dog grooming tips.' That doesn't mean they're buying dog brushes on Amazon.",
      },
      {
        type: "p",
        text: "The benchmark that matters: the top 3–5 products in your target niche should each be generating 200+ sales per month. If the market leader only does 80 sales a month, that's a hobby — not a business opportunity.",
      },
      {
        type: "ul",
        items: [
          "BSR (Best Seller Rank) under 50,000 in most categories = meaningful, consistent sales volume",
          "Multiple sellers winning, not one brand with a monopoly on the niche",
          "Consistent demand across multiple months, not a spike from a viral trend",
          "Demand exists at a price point that allows a healthy margin after fees",
        ],
      },
      {
        type: "callout",
        variant: "warning",
        title: "The Seasonal Trap",
        text: "Seasonal products aren't automatically bad — but if you launch a Christmas ornament in November, you have 6 weeks to make your money back before you're paying storage fees on dead inventory for 10 months. Know the calendar before you commit.",
      },
      {
        type: "h2", id: "signal-2",
        text: "Signal 2: Winnable Competition",
      },
      {
        type: "p",
        text: "Here's where most sellers make a fatal mistake: they see high competition and run away from good opportunities, or they see 'low competition' and walk into a trap. High competition isn't automatically bad. Unwinnable competition is.",
      },
      {
        type: "p",
        text: "The real question isn't 'how many competitors are there?' It's 'can a new seller with a better product and a smarter launch realistically rank on page 1 within 6 months?' If the answer is no — it's a NO-GO, regardless of how much demand exists.",
      },
      {
        type: "callout",
        variant: "tip",
        title: "What Unwinnable Actually Looks Like",
        text: "Unwinnable: brands with 3,000+ reviews on every listing, Amazon itself selling the product, patents on core features, or a niche built entirely on brand loyalty (think: branded tech accessories). Winnable: top sellers have 50–500 reviews, listings have clear weaknesses in images or copy, and the price leaves room to compete.",
      },
      {
        type: "ul",
        items: [
          "Check positions 4–15, not just the top 3 — the top sellers are often outliers",
          "Read the 1-star reviews of top competitors — complaints are your product opportunity",
          "Are the top sellers brands or generic? Generic = easier to enter",
          "Can you clearly articulate one way your product is better? If not, don't enter",
        ],
      },
      {
        type: "h2", id: "signal-3",
        text: "Signal 3: Healthy Margin",
      },
      {
        type: "p",
        text: "This is the signal that blindsides the most new sellers. A product can have strong demand and winnable competition — and still destroy your bank account if the margin math doesn't work. Amazon is not a cheap platform to sell on.",
      },
      {
        type: "p",
        text: "Run this calculation before you ever contact a supplier. Not after you've fallen in love with the product. Before.",
      },
      {
        type: "ol",
        items: [
          "Start with your target selling price (check what the market actually sells at — not what you wish it sold at)",
          "Subtract Amazon referral fee (typically 15% for most categories)",
          "Subtract FBA fulfillment fee (varies by size and weight — check the fee calculator)",
          "Subtract your COGS including manufacturing, quality control, and shipping to Amazon",
          "Subtract estimated PPC spend (budget 15–25% of revenue for the first 60–90 days)",
          "What's left is your actual profit per unit — you need at least 25–30% net margin to survive",
        ],
      },
      {
        type: "callout",
        variant: "stat",
        title: "The Brutal Math Reality",
        text: "A product selling at $22.99: Amazon takes $3.45 in referral fees, FBA fulfillment is ~$4.25, COGS with shipping is $6.00, and PPC costs $3.80. That leaves $5.49 — a 24% margin before returns, storage, and any surprises. This is why so many 'selling well' products are actually losing money quietly.",
      },
      {
        type: "h2", id: "signal-4",
        text: "Signal 4: Your Differentiation Angle",
      },
      {
        type: "p",
        text: "The worst product you can launch in 2026 is a me-too product — identical to everything on page 1, with no reason for a buyer to choose you over the others. You don't need to invent something new. You don't need a patent. You need one clear, obvious reason why your product is the better choice.",
      },
      {
        type: "p",
        text: "Before you order inventory, you should be able to complete this sentence without hesitating: 'Our product is better than the alternatives because ____________.' If you can't complete it in under 10 seconds, you don't have a differentiation angle. You have a copy.",
      },
      {
        type: "ul",
        items: [
          "Better materials — premium version of a commodity product",
          "Solved problem — fixes a specific complaint from competitor reviews",
          "Bundled value — includes accessories or extras competitors charge for",
          "Better target — same product, repositioned for a specific underserved audience",
          "Better listing — when the niche has genuinely weak imagery and copy across the board",
        ],
      },
      {
        type: "h2", id: "the-decision",
        text: "The GO / NO-GO Decision Framework",
      },
      {
        type: "p",
        text: "Once you have data on all 4 signals, the decision should be binary. Not 'maybe.' Not 'let me think about it.' A product with all 4 signals green is a clear GO. A product with any signal red is a NO-GO — even if the other three look amazing.",
      },
      {
        type: "quote",
        text: "One red signal doesn't mean the niche is dead. It means this version of your idea needs to change before it's worth your money.",
      },
      {
        type: "callout",
        variant: "warning",
        title: "The Sunk Cost Trap",
        text: "The most expensive mistake sellers make is overriding a NO-GO because they've already spent time and energy on the idea. That's sunk cost thinking — and it costs real money. Walk away from a bad product before you order samples. Samples are $200. Inventory is $5,000. Choose your pain.",
      },
      {
        type: "cta",
        title: "Get an Instant GO / NO-GO on Any Product",
        text: "Stop guessing. SellerMentor analyzes real Amazon data and gives you a clear GO or NO-GO — demand score, competition level, opportunity rating — in under 60 seconds. Free to try.",
        buttonText: "Get My GO / NO-GO Now — Free",
        buttonHref: "/analyze",
      },
      {
        type: "h2", id: "mistakes",
        text: "3 Mistakes That Kill Good Products",
      },
      {
        type: "p",
        text: "Even sellers who find genuinely strong products make avoidable mistakes in the validation phase. These three come up constantly:",
      },
      {
        type: "ol",
        items: [
          "Validating on Google Trends instead of Amazon data — Google interest ≠ Amazon buying intent. Different platform, different audience, different purchase behavior. A product can trend on Google and move zero units on Amazon.",
          "Only analyzing the top 3 results — the top 3 sellers are almost always outliers with advantages you don't have. Look at positions 4–15 to understand what an average seller in the niche is actually doing.",
          "Skipping the margin math until after sampling — 'it sells well' tells you nothing about whether it's worth selling. Run the numbers first. Always.",
        ],
      },
      {
        type: "p",
        text: "Product validation isn't a guarantee — nothing in business is. But a rigorous 4-signal GO/NO-GO process eliminates the obvious failures before they cost you. That alone puts you ahead of the majority of new Amazon sellers who lead with excitement instead of data.",
      },
      { type: "divider" },
      {
        type: "p",
        text: "The sellers who win on Amazon aren't the ones who found the most exciting product. They're the ones who found the right product — and had the discipline to say NO-GO to everything else. That discipline is a skill. Build it before you build anything else.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // POST 2: Listing Images
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: "amazon-listing-images-guide-2026",
    title: "Amazon Listing Images in 2026: The 7 Slots That Make or Break Your Conversion Rate",
    excerpt: "Buyers decide in under 3 seconds — before they read your title, your price, or a single bullet point. Your 7 image slots are your entire sales pitch. Here's exactly what to put in each one.",
    category: "Listing Optimization",
    categoryColor: "bg-violet-50 text-violet-700 border-violet-100",
    readTime: 7,
    publishedAt: "2026-04-01",
    coverImage: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=1200&q=80",
    featured: false,
    tags: ["listing images", "product photography", "amazon listing", "conversion rate optimization"],
    tocItems: [
      { id: "3-seconds", text: "The 3-Second Rule That Determines Everything", level: 2 },
      { id: "slot-1", text: "Slot 1 — The Hero Image (Your #1 Job)", level: 2 },
      { id: "slot-2", text: "Slot 2 — The Lifestyle Image", level: 2 },
      { id: "slot-3", text: "Slot 3 — The Feature Highlight", level: 2 },
      { id: "slot-4", text: "Slot 4 — The Infographic", level: 2 },
      { id: "slot-5", text: "Slot 5 — The Problem → Solution", level: 2 },
      { id: "slot-6", text: "Slot 6 — The Comparison", level: 2 },
      { id: "slot-7", text: "Slot 7 — The Trust Builder", level: 2 },
      { id: "rules", text: "Amazon Image Rules You Cannot Break", level: 2 },
    ],
    content: [
      {
        type: "takeaways",
        items: [
          "Buyers decide in under 3 seconds — entirely from images, before reading anything.",
          "Each slot has one specific job. Using slots randomly is leaving conversion on the table.",
          "Slot 1 (Hero) is governed by strict Amazon rules — white background, no exceptions.",
          "Slots 2–7 are your sales page. Treat each one like a conversion tool, not a photo.",
        ],
      },
      {
        type: "h2", id: "3-seconds",
        text: "The 3-Second Rule That Determines Everything",
      },
      {
        type: "p",
        text: "Amazon buyers make a purchase decision in under 3 seconds. In that window, they haven't read your title. They haven't touched your bullet points. They haven't checked your price. They've looked at one thing: your main image. And in most cases — they've already scrolled past.",
      },
      {
        type: "p",
        text: "This is the most important fact about Amazon selling that most new sellers completely ignore. Your listing copy, your keywords, your PPC budget — none of it matters if your images don't stop the scroll. You can have the best product in the category and lose to a competitor with a worse product and better images. This happens every day.",
      },
      {
        type: "callout",
        variant: "stat",
        title: "Amazon's Own Data",
        text: "Listings with fully optimized image sets (all 7 slots, correct types in correct order) convert 20–40% better than listings with 1–3 generic photos. That's not a small edge — it's the difference between a profitable product and one that bleeds money on PPC.",
      },
      {
        type: "p",
        text: "Your 7 image slots are not a photo album. They're a sequential sales pitch. Each slot has one specific job, and using them randomly or interchangeably means leaving conversion — and revenue — on the table every single day.",
      },
      {
        type: "h2", id: "slot-1",
        text: "Slot 1 — The Hero Image (Your #1 Job: Stop the Scroll)",
      },
      {
        type: "p",
        text: "The hero image is the only image buyers see in search results. It's your first impression, your thumbnail, your storefront window. It has one job: make the buyer click your listing instead of the seven others on the page.",
      },
      {
        type: "p",
        text: "Amazon's rules for the main image are strict and non-negotiable. Violating them gets your listing suppressed — not warned, suppressed. No visibility, no sales.",
      },
      {
        type: "ul",
        items: [
          "Pure white background (#FFFFFF) — not off-white, not light grey, pure white",
          "Product fills at least 85% of the image frame — don't leave empty space",
          "No text, no props, no lifestyle elements, no watermarks",
          "Minimum 1000px on the shortest side — 2000×2000px recommended for zoom",
          "The product shown must be exactly what the buyer receives — no misleading angles",
        ],
      },
      {
        type: "callout",
        variant: "warning",
        title: "This Will Get Your Listing Suppressed",
        text: "Amazon's image bots actively scan for non-white backgrounds on main images. A listing suppression means zero visibility in search — and it can take 24–72 hours to restore even after you fix the image. Don't risk it. White background. Always.",
      },
      {
        type: "h2", id: "slot-2",
        text: "Slot 2 — The Lifestyle Image (Sell the Feeling, Not the Product)",
      },
      {
        type: "p",
        text: "Slot 2 is where you answer the buyer's unconscious question: 'Is this product for someone like me?' The lifestyle image shows your product in context — in the environment where your ideal buyer imagines themselves using it.",
      },
      {
        type: "p",
        text: "The mistake most sellers make: generic lifestyle imagery. 'Person using kitchen product in kitchen' converts poorly. 'Exhausted parent making lunches at 7am with kids visible in the background' converts because it creates instant identification. Specificity is everything.",
      },
      {
        type: "callout",
        variant: "tip",
        title: "The Specificity Test",
        text: "Look at your lifestyle image and ask: does this show exactly who this product is for, in exactly the moment they'd use it? If someone can look at it and think 'that's me,' it works. If it could be stock photography for any product in the category, it's not doing its job.",
      },
      {
        type: "h2", id: "slot-3",
        text: "Slot 3 — The Feature Highlight (One Thing, Done Unforgettably)",
      },
      {
        type: "p",
        text: "Pick your single strongest product feature — the one thing that genuinely separates you from every competitor in the niche — and dedicate an entire image to it. Zoom in. Use a callout annotation. Make it impossible to miss and impossible to forget.",
      },
      {
        type: "p",
        text: "This is not the place for a list of features. Not three things. Not two things. One thing, shown clearly, explained briefly. If you try to show everything in slot 3, you communicate nothing — and the buyer moves on.",
      },
      {
        type: "h2", id: "slot-4",
        text: "Slot 4 — The Infographic (For Buyers Who Skip Bullets)",
      },
      {
        type: "p",
        text: "A significant percentage of Amazon buyers never read bullet points. They scroll images. Your infographic image exists for these buyers — it condenses your top 3–5 benefits into a clean, scannable visual. Icons, short labels, consistent design.",
      },
      {
        type: "ul",
        items: [
          "3–5 features maximum — one image, one clear story",
          "Icons communicate faster than words wherever possible",
          "Consistent font, colors, and spacing — amateur layouts destroy trust",
          "If dimensions or materials matter for your product, make them obvious here",
        ],
      },
      {
        type: "h2", id: "slot-5",
        text: "Slot 5 — The Problem → Solution (The Highest-Converting Image Type)",
      },
      {
        type: "p",
        text: "Pain converts better than pleasure. A buyer who is actively frustrated with a problem is far more likely to buy than a buyer who's browsing. The problem-solution image speaks directly to that pain — and immediately shows your product as the answer.",
      },
      {
        type: "p",
        text: "Format: two panels. Left: the problem (the mess, the frustration, the failure). Right: your product solving it. The before-after format. Clean, clear, direct. No cleverness needed — the more obvious the contrast, the better it converts.",
      },
      {
        type: "callout",
        variant: "tip",
        title: "The 2-Second Rule for the Problem Panel",
        text: "The problem shown on the left must be immediately, viscerally recognizable. If the viewer has to think for more than 2 seconds about what the problem is — the image has already failed. The pain should be obvious and relatable the instant they see it.",
      },
      {
        type: "h2", id: "slot-6",
        text: "Slot 6 — The Comparison (Pre-Empt the 'Why Not the Cheap One?' Objection)",
      },
      {
        type: "p",
        text: "Every buyer considering your product has one silent objection: 'Why shouldn't I just buy the cheaper generic version?' If you don't answer that question somewhere in your listing, they'll answer it themselves — by buying the cheaper one.",
      },
      {
        type: "p",
        text: "A clean comparison image — your product vs. generic alternatives — makes that question easy to answer. Show exactly where you win. Be specific. 'Thicker material' is weak. '2.5mm vs. 1mm wall thickness — lasts 3x longer' is strong.",
      },
      {
        type: "h2", id: "slot-7",
        text: "Slot 7 — The Trust Builder (Close the Hesitant Buyer)",
      },
      {
        type: "p",
        text: "Slot 7 is for the buyer who is almost convinced but hasn't clicked Add to Cart yet. They need one more reason to trust you. This could be: a guarantee ('30-day no-questions return'), a review quote, a certification badge, a 'what's in the box' breakdown, or your brand story compressed into a single visual.",
      },
      {
        type: "h2", id: "rules",
        text: "Amazon Image Rules You Cannot Break",
      },
      {
        type: "ol",
        items: [
          "Main image: white background only — listing suppression is automatic, not negotiable",
          "No Amazon branding, logos, or Prime badges in any image",
          "No claims of '#1' or 'best' without documented third-party proof",
          "Minimum 1000px on longest side — 2000px recommended for zoom to activate",
          "Images must represent what the buyer actually receives — no misleading mockups",
        ],
      },
      {
        type: "cta",
        title: "Create Your Full 7-Image Set With AI — In Minutes",
        text: "SellerMentor's Listing Studio uses CLAID AI to remove backgrounds, generate lifestyle shots, and build your complete image strategy. Upload your product photo and walk away with a professional listing.",
        buttonText: "Build My Listing Images Free",
        buttonHref: "/studio",
      },
      {
        type: "p",
        text: "Great listing images aren't about budget — they're about strategy. A $50 product photo combined with the right image types in the right slots will consistently outperform a $2,000 photoshoot with no strategy behind it. Know what each slot needs to do, then execute it clearly. That's the whole game.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // POST 3: Listing Copywriting
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: "amazon-listing-copywriting-bullets-that-sell",
    title: "Amazon Listing Copywriting: The Exact Formula Behind Bullets That Actually Convert",
    excerpt: "Most Amazon bullet points describe features. The ones that drive sales describe outcomes. Here's the exact formula top sellers use — with real before/after examples you can copy today.",
    category: "Copywriting",
    categoryColor: "bg-emerald-50 text-emerald-700 border-emerald-100",
    readTime: 6,
    publishedAt: "2026-04-03",
    coverImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80",
    featured: false,
    tags: ["listing copywriting", "amazon bullets", "listing optimization", "amazon conversion"],
    tocItems: [
      { id: "the-real-problem", text: "Why 90% of Amazon Bullets Don't Convert", level: 2 },
      { id: "title-formula", text: "The Title Formula That Ranks and Converts", level: 2 },
      { id: "bullet-formula", text: "The Bullet Formula: Outcome → Feature → Proof", level: 2 },
      { id: "before-after", text: "Before & After: Real Examples", level: 2 },
      { id: "keywords", text: "Where Keywords Actually Belong", level: 2 },
      { id: "description", text: "The Product Description: Your Closing Argument", level: 2 },
    ],
    content: [
      {
        type: "takeaways",
        items: [
          "Features describe. Outcomes sell. Your bullets should lead with what the buyer's life looks like after purchase.",
          "Every high-converting bullet follows the same structure: OUTCOME → Feature → Proof.",
          "Keywords go in specific places — stuffing them everywhere hurts more than it helps.",
          "The description is your last chance to close. Treat it like a sales argument, not an afterthought.",
        ],
      },
      {
        type: "h2", id: "the-real-problem",
        text: "Why 90% of Amazon Bullets Don't Convert",
      },
      {
        type: "p",
        text: "There are two types of Amazon bullet points. The ones that make buyers add to cart without reading anything else — and the ones that make them hit the back button. The difference isn't what product you're selling. It's not how many keywords you've stuffed in. It's one thing: are you describing what the product IS, or what the buyer's life BECOMES after they buy it?",
      },
      {
        type: "p",
        text: "Read 10 Amazon listings right now. Nine of them will look like product spec sheets. 'Made with stainless steel.' 'Dimensions: 12 x 8 x 3 inches.' 'Available in 3 colors.' These are facts about the product. They are not reasons to buy. The listing that wins is the one that answers the buyer's actual question: 'What problem does this solve for me, specifically, right now?'",
      },
      {
        type: "callout",
        variant: "stat",
        title: "What the Data Shows",
        text: "Amazon's own internal testing consistently shows that listings with benefit-led copy (outcomes first, features second) outperform feature-led listings by 15–35% in conversion rate. That gap compounds across every unit sold, every day your listing is live.",
      },
      {
        type: "h2", id: "title-formula",
        text: "The Title Formula That Ranks and Converts",
      },
      {
        type: "p",
        text: "Your title has two audiences with competing needs: Amazon's algorithm (which needs exact-match keywords to rank you in search) and the buyer (who needs to understand what they're looking at in under 5 seconds). Most sellers optimize for one and ignore the other. The formula below handles both.",
      },
      {
        type: "ol",
        items: [
          "Primary keyword — the exact search term with highest monthly volume in your niche",
          "Your clearest differentiator — one thing that makes yours better than the alternatives",
          "Secondary use cases or compatibility — who or what it works for",
          "Pack size, quantity, or variant — if it's relevant to the buying decision",
        ],
      },
      {
        type: "p",
        text: "Real example: 'PetPro Self-Cleaning Dog Brush for Shedding — Removes 95% of Loose Fur in One Click — Works on Short & Long Hair, All Breeds' — Primary keyword first, one clear differentiator with a specific claim, compatibility at the end. Under 200 characters. Readable in 5 seconds.",
      },
      {
        type: "callout",
        variant: "tip",
        title: "The 5-Second Scan Test",
        text: "Print your title and show it to someone who doesn't know your product. Give them 5 seconds. If they can't tell you what the product is, who it's for, and why it's different — rewrite it. If they can, you're in the right direction.",
      },
      {
        type: "h2", id: "bullet-formula",
        text: "The Bullet Formula: Outcome → Feature → Proof",
      },
      {
        type: "p",
        text: "Every one of your 5 bullet points should follow the same structure, without exception. Start with the OUTCOME in capital letters (what changes for the buyer). Then name the feature that delivers it. Then add the specific proof that makes it believable.",
      },
      {
        type: "callout",
        variant: "stat",
        title: "The Formula",
        text: "OUTCOME IN CAPS — The feature that delivers it — specific number, detail, or proof that makes the outcome believable and earns trust.",
      },
      {
        type: "p",
        text: "Your 5 bullets should cover these 5 topics in this exact order: (1) Primary benefit and main differentiator, (2) Ease of use, (3) Quality and durability, (4) Versatility or compatibility, (5) Guarantee or trust signal. This order mirrors the buyer's decision journey — most important first, risk removal last.",
      },
      {
        type: "h2", id: "before-after",
        text: "Before & After: Real Examples",
      },
      {
        type: "p",
        text: "The difference between feature copy and outcome copy isn't subtle. Here it is side by side, using a dog brush as the example:",
      },
      {
        type: "ul",
        items: [
          "❌ 'Made with high-quality stainless steel bristles for effective grooming'",
          "✅ 'REMOVES UP TO 95% OF LOOSE FUR IN ONE PASS — Fine stainless bristles penetrate the undercoat without scratching skin, cutting grooming time from 20 minutes to under 7'",
          "❌ 'Easy to clean — just press the button to retract bristles'",
          "✅ 'CLEANS ITSELF IN ONE CLICK, ZERO MESS — Press the retraction button and fur falls cleanly into the bin. No pulling, no tangling, no fur on your hands between sessions'",
          "❌ 'Suitable for all dog breeds and coat types'",
          "✅ 'WORKS ON EVERY COAT TYPE — Short, long, curly, double-coated — tested on 12 breeds with the same result: less shedding, less cleanup, happier dog'",
        ],
      },
      {
        type: "p",
        text: "The after versions are longer. They're also far more specific. Specificity is what makes claims believable. '95% of loose fur' is believable. 'Effective grooming' is marketing. One creates trust — the other creates skepticism.",
      },
      {
        type: "h2", id: "keywords",
        text: "Where Keywords Actually Belong",
      },
      {
        type: "p",
        text: "Amazon's algorithm indexes keywords from your title, bullets, description, and backend search terms. Here is the priority order for placement — and ignoring this order means wasting keyword weight on low-impact locations.",
      },
      {
        type: "ol",
        items: [
          "Title — highest algorithm weight, primary and secondary keywords here",
          "First bullet point — strong weight, include your most important secondary keywords",
          "Remaining 4 bullets — include keywords naturally where they fit the copy",
          "Product description — good for long-tail variations and supporting terms",
          "Backend search terms — everything that didn't fit above, no repetition needed",
        ],
      },
      {
        type: "callout",
        variant: "warning",
        title: "Keyword Stuffing Backfires",
        text: "A listing that reads 'dog brush pet grooming brush for dogs dog hair remover brush' signals low quality to both Amazon's algorithm and the buyer. Amazon's NLP now penalizes unnatural keyword patterns. Write for a human first. The algorithm catches up — and so does your conversion rate.",
      },
      {
        type: "h2", id: "description",
        text: "The Product Description: Your Closing Argument",
      },
      {
        type: "p",
        text: "Most sellers treat the description as an afterthought — a place to paste their bullets with slightly different wording. That's a wasted opportunity. The buyer reading your description is still on the fence. They've seen your images. They've read your bullets. Something is stopping them. Your description's job is to remove that last objection and close.",
      },
      {
        type: "p",
        text: "A description that converts: opens with the buyer's pain (not your product), builds identification with a short relatable scenario, addresses the top 1–2 objections head-on, then ends with a clear and confident call to action. If you have Brand Registry and A+ content access, invest there instead — A+ replaces the description and converts significantly better with visual modules.",
      },
      {
        type: "cta",
        title: "Write Your Entire Listing in 30 Seconds",
        text: "SellerMentor's Listing Copywriter generates an Amazon-optimized title, 5 conversion-focused bullets, and a full description — trained on what actually sells. No blank page. No guessing.",
        buttonText: "Write My Listing Copy Now — Free",
        buttonHref: "/listing-builder",
      },
      {
        type: "p",
        text: "Great listing copy is a formula applied with discipline. Lead with outcomes. Back them with specifics. Put keywords where they count. Close with confidence. Do this consistently and your conversion rate will tell the story — in your bank account.",
      },
    ],
  },
]

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find(p => p.slug === slug)
}

export function getRelatedPosts(slug: string): BlogPost[] {
  return POSTS.filter(p => p.slug !== slug).slice(0, 2)
}
