import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CarCheck AI — בדיקת רכב לפני קנייה',
  description: 'ניתוח AI מקצועי לרכב משומש. קבל דוח 360° עם המלצה ברורה — קנה, אל תקנה, או תתמקח.',
  openGraph: {
    title: 'CarCheck AI — בדוק לפני שאתה קונה',
    description: 'ניתוח חכם של רכב משומש בכמה שניות. מבוסס על ביטוח, מוסך, נתוני רישוי ומסד נתונים של תקלות.',
    locale: 'he_IL',
  },
}

export default function CarCheckLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" lang="he" className="min-h-screen bg-[#F7F8FA]" style={{ fontFamily: "'Segoe UI', 'Arial Hebrew', Arial, sans-serif" }}>
      {children}
    </div>
  )
}
