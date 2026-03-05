"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

const sections = [
  {
    id: "collection",
    number: "1",
    title: "Information We Collect",
    subsections: [
      {
        subtitle: "Account Information",
        content:
          "When you create an account, we collect your name, email address, and encrypted password. If you subscribe to a paid plan, we collect billing information through our payment processor; we do not store full credit card numbers on our servers.",
      },
      {
        subtitle: "Product Analysis Inputs",
        content:
          "When you use the Service, you provide product-related data including product names, descriptions, ASINs, pricing information, category details, target marketplace, and competitive context. This data is used exclusively to generate your Analysis Outputs.",
      },
      {
        subtitle: "Usage Data",
        content:
          "We automatically collect information about how you interact with the Service, including pages visited, features used, analysis frequency, session duration, referring URLs, and timestamp information.",
      },
      {
        subtitle: "Technical Data",
        content:
          "We collect device information (browser type, operating system, device type), IP address, and general geographic location derived from your IP address. This data is used for security, analytics, and service optimization.",
      },
    ],
  },
  {
    id: "ai-processing",
    number: "2",
    title: "AI Processing Disclosure",
    paragraphs: [
      "SellerMentor uses artificial intelligence and machine learning models to process your inputs and generate Analysis Outputs. Your product analysis inputs may be processed by our proprietary algorithms as well as third-party AI service providers.",
      "When your data is sent to third-party AI providers for processing, only the minimum information necessary to generate the analysis is transmitted. We maintain data processing agreements with all third-party AI providers that include confidentiality obligations and restrictions on data use.",
      "AI models may use aggregated and anonymized data patterns to improve the quality of the Service over time. Your individual product data will not be used to train third-party AI models without your explicit consent.",
    ],
  },
  {
    id: "use",
    number: "3",
    title: "How We Use Your Information",
    list: [
      "Provide, operate, and maintain the Service and generate Analysis Outputs",
      "Process transactions and manage your subscription",
      "Communicate with you about service updates, security alerts, and support",
      "Analyze usage patterns to improve and optimize the Service",
      "Detect, prevent, and address technical issues, fraud, and security threats",
      "Comply with legal obligations and enforce our Terms of Service",
      "Generate aggregated, anonymized insights about marketplace trends (no individual data is exposed)",
    ],
  },
  {
    id: "storage",
    number: "4",
    title: "Data Storage and Security",
    paragraphs: [
      "Your data is stored using enterprise-grade cloud infrastructure providers that maintain SOC 2 Type II compliance, ISO 27001 certification, and industry-standard physical and network security controls. We use Supabase for authentication and primary data storage, which provides encrypted data at rest and in transit, automated backups, and row-level security.",
      "We implement reasonable and appropriate technical and organizational security measures including encryption of data in transit (TLS 1.2+) and at rest (AES-256), secure password hashing, regular security reviews, and access controls limiting employee access to user data on a need-to-know basis.",
      "While we implement commercially reasonable safeguards, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security of your data, and you acknowledge that you provide data at your own risk.",
    ],
  },
  {
    id: "sharing",
    number: "5",
    title: "Data Sharing and Disclosure",
    paragraphs: [
      "We do not sell, rent, or trade your personal information to third parties for marketing purposes. We share your data only in the following limited circumstances:",
    ],
    subsections: [
      {
        subtitle: "Service Providers",
        content:
          "We share data with third-party service providers who perform services on our behalf, including AI processing, cloud hosting, payment processing, email delivery, and analytics. These providers are contractually obligated to use your data only for the specific services they provide to us.",
      },
      {
        subtitle: "Legal Requirements",
        content:
          "We may disclose your information if required to do so by law, regulation, legal process, or governmental request, or if we believe in good faith that disclosure is necessary to protect our rights, your safety, or the safety of others.",
      },
      {
        subtitle: "Business Transfers",
        content:
          "In the event of a merger, acquisition, reorganization, or sale of assets, your data may be transferred as part of that transaction. We will notify you of any such change in ownership or control of your personal information.",
      },
    ],
  },
  {
    id: "cookies",
    number: "6",
    title: "Cookies and Tracking Technologies",
    paragraphs: [
      "We use cookies and similar technologies for the following purposes:",
    ],
    subsections: [
      {
        subtitle: "Essential Cookies",
        content:
          "Required for authentication, session management, and security. These cookies cannot be disabled without affecting core Service functionality.",
      },
      {
        subtitle: "Analytics Cookies",
        content:
          "Used to understand how users interact with the Service, identify usage patterns, and improve performance. We use privacy-focused analytics that do not create individual user profiles for advertising purposes.",
      },
    ],
    paragraphsAfter: [
      "You can control cookie preferences through your browser settings. Disabling essential cookies may prevent you from using certain features of the Service. We do not use cookies for third-party advertising or behavioral targeting.",
    ],
  },
  {
    id: "rights",
    number: "7",
    title: "Your Rights",
    paragraphs: [
      "Depending on your jurisdiction, you may have the following rights regarding your personal data:",
    ],
    list: [
      "Access: Request a copy of the personal data we hold about you",
      "Correction: Request correction of inaccurate or incomplete personal data",
      "Deletion: Request deletion of your personal data, subject to legal retention requirements",
      "Portability: Request a machine-readable copy of your data for transfer to another service",
      "Restriction: Request restriction of processing of your personal data in certain circumstances",
      "Objection: Object to processing of your personal data for specific purposes",
      "Withdrawal of Consent: Withdraw previously given consent for data processing at any time",
    ],
    paragraphsAfter: [
      "To exercise any of these rights, contact us at privacy@amzmentor.ai. We will respond to all verified requests within thirty (30) days. We may request additional information to verify your identity before processing a request.",
      "If you delete your account, we will remove your personal data within thirty (30) days, except where retention is required by law or for legitimate business purposes (such as fraud prevention). Anonymized, aggregated data that cannot be used to identify you may be retained indefinitely.",
    ],
  },
  {
    id: "retention",
    number: "8",
    title: "Data Retention",
    paragraphs: [
      "We retain your account information and analysis history for as long as your account is active and as needed to provide you with the Service. If you request account deletion, we will delete or anonymize your personal data within thirty (30) days, except where longer retention is required by law, necessary for fraud prevention, or required to resolve disputes.",
      "Transaction records and billing information may be retained for up to seven (7) years for tax and accounting compliance purposes. Server logs containing IP addresses and technical data are retained for a maximum of ninety (90) days.",
    ],
  },
  {
    id: "international",
    number: "9",
    title: "International Data Transfers",
    paragraphs: [
      "Your data may be processed and stored in the United States and other jurisdictions where our service providers operate. If you are located outside the United States, your data may be transferred to, stored, and processed in jurisdictions that may have different data protection laws than your jurisdiction of residence.",
      "Where required by applicable law, we implement appropriate safeguards for international data transfers, including standard contractual clauses approved by relevant regulatory authorities.",
    ],
  },
  {
    id: "children",
    number: "10",
    title: "Children's Privacy",
    paragraphs: [
      "The Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected personal data from a child without parental consent, we will take steps to delete that information promptly.",
    ],
  },
  {
    id: "changes",
    number: "11",
    title: "Changes to This Policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, legal requirements, or other factors. We will notify you of material changes by email or through a prominent notice within the Service at least fourteen (14) days before the changes take effect.",
      "We encourage you to review this Privacy Policy periodically. Your continued use of the Service after the effective date of any changes constitutes acceptance of the revised Privacy Policy.",
    ],
  },
  {
    id: "contact",
    number: "12",
    title: "Contact Information",
    paragraphs: [
      "If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:",
    ],
    contact: [
      { label: "Privacy inquiries", value: "privacy@amzmentor.ai" },
      { label: "Data protection officer", value: "dpo@amzmentor.ai" },
      { label: "General support", value: "support@amzmentor.ai" },
    ],
    paragraphsAfter: [
      "We will make reasonable efforts to respond to your inquiry within five (5) business days. For data protection inquiries in the European Economic Area, you also have the right to lodge a complaint with your local supervisory authority.",
    ],
  },
]

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState("collection")

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id)
        }
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0 }
    )

    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#fef3c7]/60 via-background to-[#dbeafe]/30" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />
      <Navbar />

      <main className="relative flex-1">
        <div className="mx-auto max-w-[1100px] px-6 py-16 md:py-20">
          {/* Header */}
          <div className="mb-12 max-w-2xl">
            <p className="text-sm font-medium text-primary">Legal</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl text-balance">
              Privacy Policy
            </h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              This policy describes how SellerMentor collects, uses, stores, and protects your personal information when you use our Service.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Effective date: February 19, 2026
            </p>
          </div>

          {/* Two-column layout */}
          <div className="flex gap-12">
            {/* Sticky sidebar */}
            <aside className="hidden w-56 shrink-0 lg:block">
              <nav className="sticky top-24">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-4">
                  On this page
                </p>
                <div className="flex flex-col gap-0.5">
                  {sections.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className={cn(
                        "block rounded-md px-3 py-1.5 text-[13px] leading-snug transition-colors",
                        activeSection === s.id
                          ? "bg-primary/8 font-medium text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                      )}
                    >
                      {s.number}. {s.title}
                    </a>
                  ))}
                </div>
              </nav>
            </aside>

            {/* Main content */}
            <div className="min-w-0 flex-1">
              <div className="rounded-2xl border border-border bg-card shadow-sm">
                <div className="p-8 md:p-10 lg:p-12">
                  <div className="flex flex-col gap-14">
                    {sections.map((s) => (
                      <section key={s.id} id={s.id} className="scroll-mt-28">
                        <div className="flex items-baseline gap-3 mb-4">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-xs font-bold text-primary">
                            {s.number}
                          </span>
                          <h2 className="text-lg font-semibold text-foreground">{s.title}</h2>
                        </div>

                        <div className="flex flex-col gap-4 pl-10">
                          {s.paragraphs?.map((p, i) => (
                            <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                              {p}
                            </p>
                          ))}

                          {s.subsections?.map((sub, i) => (
                            <div key={i} className="mt-1">
                              <h3 className="text-sm font-semibold text-foreground/90 mb-1.5">{sub.subtitle}</h3>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {sub.content}
                              </p>
                            </div>
                          ))}

                          {s.list && (
                            <ul className="flex flex-col gap-2">
                              {s.list.map((item, j) => (
                                <li key={j} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          )}

                          {s.paragraphsAfter?.map((p, i) => (
                            <p key={`after-${i}`} className="text-sm text-muted-foreground leading-relaxed">
                              {p}
                            </p>
                          ))}

                          {s.contact && (
                            <div className="mt-2 rounded-xl border border-border bg-secondary/30 p-5">
                              <div className="flex flex-col gap-3">
                                {s.contact.map((c) => (
                                  <div key={c.label} className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">{c.label}</span>
                                    <span className="text-sm font-medium text-foreground">{c.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </section>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
