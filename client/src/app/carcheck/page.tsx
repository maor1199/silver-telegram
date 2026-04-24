'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const scenarios = [
  {
    id: 'insurance',
    icon: '📋',
    title: 'דוח סליקה ביטוחי',
    subtitle: 'PDF מ-infocar.co.il',
    description: 'העלה את דוח הביטוח של הרכב ונקבל עבורך תרגום לעברית פשוטה, זיהוי תאונות, והמלצה על מחיר מיקוח.',
    tags: ['PDF', 'תאונות', 'מחיר מיקוח'],
    color: '#1B4FD8',
  },
  {
    id: 'garage',
    icon: '🔧',
    title: 'טופס בדיקת מוסך',
    subtitle: 'צילום הטופס',
    description: 'צלם את טופס הבדיקה של המוסך ונסביר לך מה כל X אומר, מה חובה לתקן ומה ניתן לדחות.',
    tags: ['צילום', 'ליקויים', 'עלות תיקון'],
    color: '#0F766E',
  },
  {
    id: 'specific',
    icon: '🚗',
    title: 'ייעוץ על רכב ספציפי',
    subtitle: 'דגם + שנה + מחיר',
    description: 'הכנס מספר רישוי, דגם, שנה ומחיר מבוקש — נשלוף נתוני רישוי, תקלות ידועות ו-3 שאלות לשאול את המוכר.',
    tags: ['מספר רישוי', 'תקלות ידועות', 'ניתוח מחיר'],
    color: '#7C3AED',
  },
  {
    id: 'budget',
    icon: '💡',
    title: 'תקציב וצרכים',
    subtitle: 'מה כדאי לקנות?',
    description: 'ספר לנו את התקציב, השימושים וההעדפות — ונמליץ על 3 רכבים מתאימים עם יתרונות, חסרונות ומה לחפש.',
    tags: ['המלצות', 'השוואה', 'מה לחפש'],
    color: '#B45309',
  },
]

const steps = [
  { num: '01', title: 'בחר תרחיש', desc: 'בחר את סוג הבדיקה שמתאים לך' },
  { num: '02', title: 'מלא פרטים', desc: 'הכנס מידע או העלה קובץ' },
  { num: '03', title: 'קבל דוח', desc: 'AI מנתח ומחזיר המלצה ברורה' },
]

export default function CarCheckHome() {
  const router = useRouter()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <div className="min-h-screen" style={{ background: '#F7F8FA' }}>
      {/* Header */}
      <header style={{ background: '#0F1C3F', borderBottom: '1px solid #1E2D5A' }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{ background: '#1B4FD8', borderRadius: '10px', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              🚗
            </div>
            <div>
              <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 18, letterSpacing: '-0.3px' }}>CarCheck</span>
              <span style={{ color: '#3B82F6', fontWeight: 700, fontSize: 18 }}> AI</span>
            </div>
          </div>
          <div style={{ color: '#94A3B8', fontSize: 14 }}>
            בדיקת רכב חכמה
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-14 pb-10 text-center">
        <div style={{ display: 'inline-block', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 100, padding: '4px 16px', marginBottom: 20 }}>
          <span style={{ color: '#1B4FD8', fontSize: 13, fontWeight: 600 }}>מבוסס Claude AI + Gemini</span>
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: '#0F172A', lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.5px' }}>
          בדוק את הרכב לפני שאתה קונה
        </h1>
        <p style={{ fontSize: 18, color: '#475569', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
          ניתוח AI של מסמכי הרכב, טופס המוסך ונתוני הרישוי — תוך שניות.
          <br />
          <strong style={{ color: '#0F172A' }}>הדוח הראשון חינמי.</strong>
        </p>
      </section>

      {/* Scenario Cards */}
      <section className="max-w-5xl mx-auto px-6 pb-14">
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#64748B', marginBottom: 16, textAlign: 'center', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          בחר את סוג הבדיקה
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => router.push(`/carcheck/analyze?scenario=${s.id}`)}
              onMouseEnter={() => setHoveredId(s.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                background: '#FFFFFF',
                border: hoveredId === s.id ? `2px solid ${s.color}` : '2px solid #E2E8F0',
                borderRadius: 16,
                padding: '24px 20px',
                textAlign: 'right',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                transform: hoveredId === s.id ? 'translateY(-2px)' : 'none',
                boxShadow: hoveredId === s.id ? '0 8px 24px rgba(0,0,0,0.08)' : '0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>{s.icon}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: s.color, marginBottom: 10 }}>{s.subtitle}</div>
              <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 14 }}>{s.description}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {s.tags.map((tag) => (
                  <span key={tag} style={{
                    background: '#F1F5F9',
                    color: '#475569',
                    fontSize: 12,
                    fontWeight: 500,
                    padding: '2px 10px',
                    borderRadius: 100,
                  }}>{tag}</span>
                ))}
              </div>
              <div style={{
                marginTop: 16,
                padding: '10px 0',
                background: hoveredId === s.id ? s.color : '#F8FAFC',
                borderRadius: 10,
                color: hoveredId === s.id ? '#FFFFFF' : '#475569',
                fontSize: 14,
                fontWeight: 600,
                transition: 'all 0.18s ease',
              }}>
                {hoveredId === s.id ? 'לחץ להמשיך ←' : 'בחר תרחיש זה'}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: '#FFFFFF', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
        <div className="max-w-5xl mx-auto px-6 py-12">
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', textAlign: 'center', marginBottom: 32 }}>
            איך זה עובד?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {steps.map((step, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: '#EFF6FF', border: '2px solid #BFDBFE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 14px',
                  fontSize: 15, fontWeight: 700, color: '#1B4FD8',
                }}>
                  {step.num}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>{step.title}</div>
                <div style={{ fontSize: 14, color: '#64748B' }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-6 py-14 text-center">
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>תמחור פשוט</h2>
        <p style={{ color: '#64748B', fontSize: 15, marginBottom: 32 }}>ללא הרשמה. ללא כרטיס אשראי לדוח הראשון.</p>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{
            background: '#FFFFFF', border: '2px solid #E2E8F0', borderRadius: 16,
            padding: '28px 36px', minWidth: 220,
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#059669', marginBottom: 4 }}>חינם</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>הדוח הראשון</div>
            <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>דוח מלא עם כל הניתוחים,<br />ללא תשלום</div>
          </div>
          <div style={{
            background: '#0F1C3F', border: '2px solid #1B4FD8', borderRadius: 16,
            padding: '28px 36px', minWidth: 220,
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#60A5FA', marginBottom: 4 }}>₪49</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF', marginBottom: 8 }}>כל דוח נוסף</div>
            <div style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6 }}>תשלום חד פעמי,<br />ללא מנוי</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0F1C3F', borderTop: '1px solid #1E2D5A', padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ color: '#475569', fontSize: 13 }}>
          CarCheck AI — אינו מהווה ייעוץ מקצועי. השתמש בשיקול דעתך לפני כל רכישה.
        </p>
      </footer>
    </div>
  )
}
