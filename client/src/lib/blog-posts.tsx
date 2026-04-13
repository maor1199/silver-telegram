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
    title: "How to Validate an Amazon Product in 2026 (Before Spending a Dollar)",
    excerpt: "Most Amazon sellers fail in the research phase — not the launch phase. Here's the exact framework for deciding GO or NO-GO before you order a single unit.",
    category: "Product Research",
    categoryColor: "bg-blue-50 text-blue-700 border-blue-100",
    readTime: 8,
    publishedAt: "2026-03-28",
    coverImage: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=1200&q=80",
    featured: true,
    tags: ["product research", "amazon fba", "product validation", "go no-go"],
    tocItems: [
      { id: "why-sellers-fail", text: "Why Most Sellers Fail at Validation", level: 2 },
      { id: "the-4-signals", text: "The 4 Signals That Predict Success", level: 2 },
      { id: "demand", text: "Signal 1: Real Demand", level: 3 },
      { id: "competition", text: "Signal 2: Winnable Competition", level: 3 },
      { id: "margin", text: "Signal 3: Healthy Margin", level: 3 },
      { id: "differentiation", text: "Signal 4: Clear Differentiation Angle", level: 3 },
      { id: "go-no-go", text: "The GO / NO-GO Decision", level: 2 },
      { id: "common-mistakes", text: "3 Mistakes That Kill Good Products", level: 2 },
    ],
    content: [
      {
        type: "takeaways",
        items: [
          "Validation happens before ordering — not after.",
          "The 4 signals: demand, competition, margin, differentiation.",
          "A product can have high demand but still be a NO-GO.",
          "Most sellers skip the margin math — don't be one of them.",
        ],
      },
      {
        type: "h2", id: "why-sellers-fail",
        text: "Why Most Sellers Fail at Validation",
      },
      {
        type: "p",
        text: "The most expensive mistake in Amazon FBA is ordering inventory for a product you haven't properly validated. It doesn't matter how good your supplier is or how beautiful your listing looks — if the product itself doesn't have the right market conditions, you're losing money before your first sale.",
      },
      {
        type: "p",
        text: "The sellers who lose $5,000–$20,000 on a bad product launch almost always made the same mistake: they confused interest with demand, and they confused low competition with opportunity. Those are very different things.",
      },
      {
        type: "callout",
        variant: "stat",
        title: "The Reality",
        text: "According to Amazon seller surveys, over 60% of first-time FBA sellers say their biggest regret was not validating their product properly before launching. The average loss from a failed first product is $4,200.",
      },
      {
        type: "h2", id: "the-4-signals",
        text: "The 4 Signals That Predict Success",
      },
      {
        type: "p",
        text: "Forget the 5-step frameworks and the 20-point checklists. Real product validation comes down to 4 things — and you need all 4 to be green before you commit.",
      },
      {
        type: "h3", id: "demand",
        text: "Signal 1: Real Demand",
      },
      {
        type: "p",
        text: "Demand means people are actively searching for this product and buying it on Amazon right now — not just in general, and not just on Google. The benchmark: the top 3–5 products in your niche should each be doing 200+ sales per month. If the market leader only does 50 sales a month, it's a niche, not a market.",
      },
      {
        type: "ul",
        items: [
          "Look at the BSR (Best Seller Rank) of the top 10 products in your category",
          "BSR under 50,000 in most categories = meaningful sales volume",
          "Check if multiple sellers are winning, not just one dominant brand",
          "Seasonal demand is fine — but know the calendar before you launch",
        ],
      },
      {
        type: "h3", id: "competition",
        text: "Signal 2: Winnable Competition",
      },
      {
        type: "p",
        text: "High competition isn't automatically bad. Unwinnable competition is. The difference: can a new seller with a better product and a smarter launch strategy realistically rank on page 1 within 6 months?",
      },
      {
        type: "p",
        text: "Red flags that make competition unwinnable: brands with 5,000+ reviews dominating every result, Amazon itself selling the product, patents on key features, or a loyal customer base built on brand trust that reviews can't replicate.",
      },
      {
        type: "callout",
        variant: "tip",
        title: "The Sweet Spot",
        text: "Look for niches where the top sellers have 50–500 reviews, their listings have obvious weaknesses (poor images, weak copy, no A+), and their prices leave room for you to compete on value.",
      },
      {
        type: "h3", id: "margin",
        text: "Signal 3: Healthy Margin",
      },
      {
        type: "p",
        text: "This is where most new sellers get blindsided. Amazon charges 15% referral fee on most categories. Add FBA fees (storage + fulfillment), PPC budget, and your COGS — and a product selling at $25 can easily net you under $3 profit per unit.",
      },
      {
        type: "p",
        text: "The minimum you should target: 30% net margin after all fees, with a selling price that leaves room to run PPC without going negative. If your math only works if everything goes perfectly, it's a NO-GO.",
      },
      {
        type: "ol",
        items: [
          "Start with your target selling price (look at the market)",
          "Subtract Amazon referral fee (15% for most categories)",
          "Subtract FBA fulfillment fee (varies by size/weight)",
          "Subtract your COGS including shipping to Amazon",
          "Subtract an estimated PPC budget (usually 15–25% of revenue early on)",
          "What's left is your real profit — target 30%+",
        ],
      },
      {
        type: "h3", id: "differentiation",
        text: "Signal 4: Clear Differentiation Angle",
      },
      {
        type: "p",
        text: "The worst product you can launch is a me-too product — identical to everything else on page 1, with no clear reason for a buyer to choose you. You don't need to invent something new. You need one clear reason why your product is better than the alternatives.",
      },
      {
        type: "ul",
        items: [
          "Better materials (premium version of a cheap product)",
          "Added functionality (solves a secondary pain point the others miss)",
          "Better packaging (bundle, gift-ready, multi-pack)",
          "Underserved audience (same product, but positioned for left-handers, seniors, professionals, etc.)",
          "Better listing (dramatically better images and copy when others are weak)",
        ],
      },
      {
        type: "h2", id: "go-no-go",
        text: "The GO / NO-GO Decision",
      },
      {
        type: "p",
        text: "Once you have data on all 4 signals, the decision is binary. It's not 'maybe' or 'let me think about it.' A good product is a clear GO. A bad product is a clear NO-GO. If you're uncertain, that uncertainty is your answer.",
      },
      {
        type: "callout",
        variant: "warning",
        title: "Don't Fall in Love With the Product",
        text: "The single biggest reason sellers override a NO-GO signal is emotional attachment — they've already spent time researching, they're excited about the niche, or they spent money on samples. Sunk cost is not a validation signal. Walk away from a bad product before it costs you real money.",
      },
      {
        type: "cta",
        title: "Get an Instant GO / NO-GO on Any Product",
        text: "SellerMentor analyzes real Amazon market data and gives you a clear decision — demand, competition, margin, opportunity score — in under 60 seconds.",
        buttonText: "Analyze a Product Free",
        buttonHref: "/analyze",
      },
      {
        type: "h2", id: "common-mistakes",
        text: "3 Mistakes That Kill Good Products",
      },
      {
        type: "p",
        text: "Even sellers who find genuinely good products make avoidable mistakes in the validation phase. Here are the three we see most often:",
      },
      {
        type: "ol",
        items: [
          "Validating on Google Trends instead of Amazon data — Google interest doesn't equal Amazon buying intent. These are different audiences with different purchase behaviors.",
          "Only looking at the top 3 results — the top 3 are often outliers. Look at positions 4–15 to understand what an average seller in the niche is doing.",
          "Skipping the margin math — 'it sells well' is not enough. Run the actual numbers before you talk to a supplier.",
        ],
      },
      {
        type: "p",
        text: "Product validation isn't a guarantee — nothing in business is. But a rigorous GO/NO-GO process eliminates the obvious failures before they cost you. That alone puts you ahead of 80% of new Amazon sellers.",
      },
      { type: "divider" },
      {
        type: "p",
        text: "The best validation tool is one that removes your bias from the decision. Use data, not excitement. GO when the signals are clear. NO-GO when they're not. And move fast — because every week you spend on a bad product idea is a week you're not building a real business.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // POST 2: Listing Images
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: "amazon-listing-images-guide-2026",
    title: "Amazon Listing Images in 2026: The 7 Slots That Make or Break Your Conversion",
    excerpt: "Your images are your product page. Buyers decide in 3 seconds — before they read a single word. Here's exactly what to put in each of Amazon's 7 image slots.",
    category: "Listing Optimization",
    categoryColor: "bg-violet-50 text-violet-700 border-violet-100",
    readTime: 7,
    publishedAt: "2026-04-01",
    coverImage: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=1200&q=80",
    featured: false,
    tags: ["listing images", "product photography", "amazon listing", "conversion"],
    tocItems: [
      { id: "why-images-first", text: "Images Beat Copy — Every Time", level: 2 },
      { id: "slot-1", text: "Slot 1: The Hero Image", level: 2 },
      { id: "slot-2", text: "Slot 2: The Lifestyle Image", level: 2 },
      { id: "slot-3", text: "Slot 3: The Feature Highlight", level: 2 },
      { id: "slot-4", text: "Slot 4: The Infographic", level: 2 },
      { id: "slot-5", text: "Slot 5: The Problem → Solution", level: 2 },
      { id: "slot-6", text: "Slot 6: The Comparison", level: 2 },
      { id: "slot-7", text: "Slot 7: The Social Proof", level: 2 },
      { id: "compliance", text: "Amazon Image Rules You Can't Break", level: 2 },
    ],
    content: [
      {
        type: "takeaways",
        items: [
          "Buyers decide in 3 seconds — based entirely on your images.",
          "Each slot has a specific job. Don't use them randomly.",
          "Slot 1 (Hero) must follow Amazon's strict rules — white background only.",
          "Slots 2–7 are your sales pitch. Use them like a landing page.",
        ],
      },
      {
        type: "h2", id: "why-images-first",
        text: "Images Beat Copy — Every Time",
      },
      {
        type: "p",
        text: "When a shopper lands on your Amazon listing, they don't read your title first. They look at your images. Research consistently shows that over 80% of purchase decisions on Amazon are influenced by product images — before the buyer reads a single word of copy.",
      },
      {
        type: "p",
        text: "This means your 7 image slots are, collectively, the most important real estate on your listing. Not your title. Not your bullets. Your images. Treat them like a mini sales page, not a photo album.",
      },
      {
        type: "callout",
        variant: "stat",
        title: "The Data",
        text: "Amazon's own A/B testing data shows that listings with optimized image sets (all 7 slots, proper types) convert 20–40% better than listings with just 1–3 images.",
      },
      {
        type: "h2", id: "slot-1",
        text: "Slot 1: The Hero Image",
      },
      {
        type: "p",
        text: "The hero image (main image) is the only image buyers see in search results. It's your first impression. It determines whether someone clicks — or keeps scrolling. This image has one job: stop the scroll.",
      },
      {
        type: "ul",
        items: [
          "Pure white background (#FFFFFF) — Amazon requires this",
          "Product fills at least 85% of the frame",
          "No props, no text, no lifestyle elements",
          "Multiple angles if helpful (e.g. front and back for packaging)",
          "Sharp, 2000×2000px minimum for zoom function",
        ],
      },
      {
        type: "callout",
        variant: "warning",
        title: "Amazon Will Suppress Your Listing",
        text: "Using a hero image that violates Amazon's white background rule is one of the most common reasons listings get suppressed. It's not a suggestion — it's a requirement.",
      },
      {
        type: "h2", id: "slot-2",
        text: "Slot 2: The Lifestyle Image",
      },
      {
        type: "p",
        text: "This is where you sell the feeling, not the product. The lifestyle image shows your product in use, in the context where your buyer imagines themselves. It answers the question: 'Is this product for someone like me?'",
      },
      {
        type: "p",
        text: "The best lifestyle images are specific. Not 'person using kitchen product in kitchen' — but 'busy mom making a school lunch while kids are in the background.' Specificity creates identification, and identification creates conversions.",
      },
      {
        type: "h2", id: "slot-3",
        text: "Slot 3: The Feature Highlight",
      },
      {
        type: "p",
        text: "Pick your single strongest product feature — the one thing that makes you different — and dedicate an entire image to it. Zoom in. Use a callout annotation. Make it impossible to miss.",
      },
      {
        type: "p",
        text: "This is not the place for a bullet list of features. One feature, shown clearly, with a short label. That's it. If you try to show everything, you show nothing.",
      },
      {
        type: "h2", id: "slot-4",
        text: "Slot 4: The Infographic",
      },
      {
        type: "p",
        text: "The infographic image condenses your top 3–5 features into a clean visual layout. Think of it as your bullet points, visualized. Icons, short text, clean design. Buyers who skip reading your bullets will often look at this image.",
      },
      {
        type: "ul",
        items: [
          "3–5 features maximum — don't overcrowd",
          "Icons over text whenever possible",
          "Consistent font, color palette, spacing",
          "Make dimensions or key specs visually clear if relevant",
        ],
      },
      {
        type: "h2", id: "slot-5",
        text: "Slot 5: The Problem → Solution",
      },
      {
        type: "p",
        text: "This is a two-panel image: left side shows the problem (frustration, mess, inefficiency), right side shows your product solving it. This image speaks directly to buyer pain — which is the most powerful motivator in any purchase decision.",
      },
      {
        type: "callout",
        variant: "tip",
        title: "Pro Tip",
        text: "The problem side should be immediately recognizable. If a buyer has to think about what the problem is, you've lost them. The pain should be obvious and relatable in under 2 seconds.",
      },
      {
        type: "h2", id: "slot-6",
        text: "Slot 6: The Comparison",
      },
      {
        type: "p",
        text: "A comparison image (you vs. generic alternatives) pre-empts the buyer's biggest objection: 'Why not just buy the cheaper one?' A clean comparison table or side-by-side visual showing where you win makes that question easy to answer.",
      },
      {
        type: "h2", id: "slot-7",
        text: "Slot 7: The Social Proof / Trust Builder",
      },
      {
        type: "p",
        text: "Use your final slot to build trust. This could be: a real customer review (screenshot style), a '4.8 stars' graphic, a 'what's in the box' shot, certifications, a satisfaction guarantee, or your brand story in a single image.",
      },
      {
        type: "h2", id: "compliance",
        text: "Amazon Image Rules You Can't Break",
      },
      {
        type: "ol",
        items: [
          "Main image: white background only, no exceptions",
          "No Amazon branding, logos, or trademarks in any image",
          "No claims of 'best' or '#1' without documented proof",
          "Minimum 1000px on the longest side (2000px recommended)",
          "Images must accurately represent the actual product you're selling",
        ],
      },
      {
        type: "cta",
        title: "Create Professional Listing Images With AI",
        text: "SellerMentor's Listing Studio removes the background, generates lifestyle shots, and builds your complete 6-image set — powered by CLAID AI.",
        buttonText: "Try Listing Studio Free",
        buttonHref: "/studio",
      },
      {
        type: "p",
        text: "Great listing images aren't about having a professional photographer on speed dial. They're about understanding what each slot needs to accomplish, and executing it clearly. The strategy is the hard part — the execution has never been more accessible.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // POST 3: Listing Copywriting
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: "amazon-listing-copywriting-bullets-that-sell",
    title: "Amazon Listing Copywriting: How to Write Bullets That Actually Sell",
    excerpt: "Most Amazon bullet points describe features. The ones that convert sell outcomes. Here's the exact formula top sellers use — with real examples.",
    category: "Copywriting",
    categoryColor: "bg-emerald-50 text-emerald-700 border-emerald-100",
    readTime: 6,
    publishedAt: "2026-04-03",
    coverImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80",
    featured: false,
    tags: ["listing copywriting", "amazon bullets", "listing optimization", "conversion copywriting"],
    tocItems: [
      { id: "features-vs-benefits", text: "Features vs. Benefits: The Core Mistake", level: 2 },
      { id: "title-formula", text: "The Title Formula That Works", level: 2 },
      { id: "bullet-formula", text: "The Bullet Point Formula", level: 2 },
      { id: "examples", text: "Before & After: Real Examples", level: 2 },
      { id: "keyword-placement", text: "Where to Put Your Keywords", level: 2 },
      { id: "description", text: "Product Description: The Hidden Opportunity", level: 2 },
    ],
    content: [
      {
        type: "takeaways",
        items: [
          "Features describe. Benefits sell. Your copy should be 80% benefits.",
          "Every bullet follows the same formula: OUTCOME + Feature + Proof.",
          "Keywords belong in specific places — not everywhere.",
          "The description is where you close the buyer who's still on the fence.",
        ],
      },
      {
        type: "h2", id: "features-vs-benefits",
        text: "Features vs. Benefits: The Core Mistake",
      },
      {
        type: "p",
        text: "Read through 10 Amazon listings in any category and you'll notice a pattern. Most bullet points describe what the product is or has — not what it does for the buyer. This is the single most common copy mistake on Amazon.",
      },
      {
        type: "p",
        text: "A feature is a fact about the product. A benefit is what that fact means for the buyer's life. 'Stainless steel blade' is a feature. 'Stays sharp 3x longer so you replace it half as often' is a benefit. One informs — the other persuades.",
      },
      {
        type: "callout",
        variant: "tip",
        title: "The 'So What?' Test",
        text: "For every feature you write, ask 'so what?' The answer is the benefit. Keep asking until the answer connects to something the buyer actually cares about — time saved, money saved, frustration avoided, status gained.",
      },
      {
        type: "h2", id: "title-formula",
        text: "The Title Formula That Works",
      },
      {
        type: "p",
        text: "Amazon titles have two audiences: the search algorithm (which needs keywords) and the buyer (who needs to understand what they're buying in 5 seconds). Your title needs to satisfy both.",
      },
      {
        type: "p",
        text: "The formula that works across most categories:",
      },
      {
        type: "ol",
        items: [
          "Brand Name (if established) or skip",
          "Primary Keyword (the exact search term with highest volume)",
          "Key Differentiator (what makes yours better — one thing)",
          "Secondary Use Cases or Compatibility (who/what it works for)",
          "Pack size, quantity, or variant if relevant",
        ],
      },
      {
        type: "p",
        text: "Example: 'PetPro Self-Cleaning Dog Brush for Shedding — Removes 95% of Loose Fur in One Click — Works on Short & Long Hair, All Breeds'",
      },
      {
        type: "p",
        text: "Notice: primary keyword early, one clear differentiator, secondary use case at the end. Under 200 characters. Easy to scan.",
      },
      {
        type: "h2", id: "bullet-formula",
        text: "The Bullet Point Formula",
      },
      {
        type: "p",
        text: "Each of your 5 bullet points should follow the same structure: start with the outcome in ALL CAPS, then explain the feature that delivers it, then add proof or specificity.",
      },
      {
        type: "callout",
        variant: "stat",
        title: "The Formula",
        text: "OUTCOME — Feature that delivers it — specific proof or detail that makes it believable.",
      },
      {
        type: "p",
        text: "Your 5 bullets should cover these topics in this order: (1) Primary benefit / main differentiator, (2) ease of use, (3) quality / durability, (4) versatility / compatibility, (5) guarantee / trust signal.",
      },
      {
        type: "h2", id: "examples",
        text: "Before & After: Real Examples",
      },
      {
        type: "p",
        text: "Here's what the difference looks like in practice, using a dog brush as the example:",
      },
      {
        type: "ul",
        items: [
          "❌ Before: 'Made with high-quality stainless steel bristles for effective grooming'",
          "✅ After: 'REMOVES UP TO 95% OF LOOSE FUR IN ONE PASS — Fine stainless bristles reach the undercoat without scratching skin, cutting grooming time in half'",
          "❌ Before: 'Easy to clean — just press the button'",
          "✅ After: 'CLEANS ITSELF IN ONE CLICK — Press the retraction button and fur falls cleanly into the bin. No pulling bristles, no mess, no wasted time between sessions'",
        ],
      },
      {
        type: "p",
        text: "The after versions are longer — but they're selling something specific. They're answering the question the buyer is actually asking: 'Will this make my life better, and how?'",
      },
      {
        type: "h2", id: "keyword-placement",
        text: "Where to Put Your Keywords",
      },
      {
        type: "p",
        text: "Amazon's A9 algorithm indexes keywords in your title, bullets, description, and backend search terms. Here's the priority order for placement:",
      },
      {
        type: "ol",
        items: [
          "Title — highest weight, most important keywords here",
          "First bullet point — still strong keyword weight",
          "Remaining bullets — include naturally, don't force",
          "Description — good for long-tail variations",
          "Backend search terms — place everything that didn't fit above",
        ],
      },
      {
        type: "callout",
        variant: "warning",
        title: "Don't Keyword Stuff",
        text: "Amazon penalizes listings that read unnaturally. A listing that repeats 'dog brush pet grooming brush for dogs dog hair brush' reads like spam. Write for humans first — the algorithm will figure it out.",
      },
      {
        type: "h2", id: "description",
        text: "Product Description: The Hidden Opportunity",
      },
      {
        type: "p",
        text: "Most sellers treat the description as an afterthought. That's a mistake. The description is where the buyer who's still on the fence makes their final decision. It's your last chance to close.",
      },
      {
        type: "p",
        text: "A great description: opens with the buyer's pain (not your product), tells a brief story that creates identification, addresses the top 2 objections, then closes with a confident call to action. If you have A+ content enabled, the description is replaced — so invest in A+ instead.",
      },
      {
        type: "cta",
        title: "Let AI Write Your Listing Copy",
        text: "SellerMentor's Listing Copywriter generates a complete, Amazon-optimized title, 5 bullets, and description in under 30 seconds — trained on what actually converts.",
        buttonText: "Generate Your Listing Copy",
        buttonHref: "/listing-builder",
      },
      {
        type: "p",
        text: "Good listing copy isn't magic — it's a formula applied consistently. Outcome first, feature second, proof third. Keywords in the right places. Buyers addressed directly. Master this pattern and your conversion rate will reflect it.",
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
