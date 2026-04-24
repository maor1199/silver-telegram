'use client'

import { Suspense, useState, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

type ScenarioId = 'insurance' | 'garage' | 'specific' | 'budget'

interface CarCheckReport {
  verdict: 'buy' | 'dont-buy' | 'negotiate'
  verdictText: string
  summary: string
  sections: ReportSection[]
  negotiationPrice?: string
  questions?: string[]
  recommendations?: CarRecommendation[]
}

interface ReportSection {
  title: string
  content: string
  severity?: 'good' | 'warning' | 'danger' | 'neutral'
}

interface CarRecommendation {
  model: string
  pros: string[]
  cons: string[]
  tips: string
}

// ─── Scenario Config ──────────────────────────────────────────────────────────

const scenarioConfig: Record<ScenarioId, {
  title: string; icon: string; description: string; fileType?: string
}> = {
  insurance: {
    title: 'דוח סליקה ביטוחי',
    icon: '📋',
    description: 'העלה את דוח הסליקה הביטוחי מ-infocar.co.il (PDF)',
    fileType: 'PDF',
  },
  garage: {
    title: 'טופס בדיקת מוסך',
    icon: '🔧',
    description: 'העלה צילום של טופס הבדיקה מהמוסך',
    fileType: 'תמונה',
  },
  specific: {
    title: 'ייעוץ על רכב ספציפי',
    icon: '🚗',
    description: 'הכנס פרטי הרכב לניתוח מקיף',
  },
  budget: {
    title: 'תקציב וצרכים',
    icon: '💡',
    description: 'ספר לנו מה אתה מחפש ונמצא לך את הרכב המתאים',
  },
}

// ─── Verdict Display ──────────────────────────────────────────────────────────

const verdictStyle = {
  buy: { bg: '#ECFDF5', border: '#6EE7B7', text: '#065F46', badge: '#059669', label: '✓ קנה' },
  'dont-buy': { bg: '#FEF2F2', border: '#FCA5A5', text: '#7F1D1D', badge: '#DC2626', label: '✗ אל תקנה' },
  negotiate: { bg: '#FFFBEB', border: '#FCD34D', text: '#78350F', badge: '#D97706', label: '↔ תתמקח' },
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 0 40px' }}>
      <div style={{ textAlign: 'center', padding: '32px 0 28px' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          border: '3px solid #BFDBFE', borderTopColor: '#1B4FD8',
          margin: '0 auto 16px', animation: 'spin 0.9s linear infinite',
        }} />
        <p style={{ color: '#475569', fontSize: 15, fontWeight: 500 }}>מנתח את הנתונים...</p>
        <p style={{ color: '#94A3B8', fontSize: 13, marginTop: 4 }}>עד 30 שניות</p>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          background: '#FFFFFF', borderRadius: 12, padding: 20, marginBottom: 12,
          border: '1px solid #E2E8F0',
        }}>
          <div style={{ height: 14, background: '#E2E8F0', borderRadius: 6, width: '40%', marginBottom: 10, animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: 11, background: '#F1F5F9', borderRadius: 6, width: '85%', marginBottom: 6 }} />
          <div style={{ height: 11, background: '#F1F5F9', borderRadius: 6, width: '70%' }} />
        </div>
      ))}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  )
}

// ─── Report Display ───────────────────────────────────────────────────────────

function ReportDisplay({ report }: { report: CarCheckReport }) {
  const v = verdictStyle[report.verdict]
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 60 }}>
      {/* Verdict Banner */}
      <div style={{
        background: v.bg, border: `2px solid ${v.border}`,
        borderRadius: 16, padding: '20px 24px', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <span style={{
            background: v.badge, color: '#FFFFFF', fontWeight: 700,
            fontSize: 14, padding: '4px 14px', borderRadius: 100,
          }}>{v.label}</span>
          <span style={{ color: v.text, fontSize: 16, fontWeight: 700 }}>{report.verdictText}</span>
        </div>
        <p style={{ color: v.text, fontSize: 14, lineHeight: 1.7, margin: 0 }}>{report.summary}</p>
        {report.negotiationPrice && (
          <div style={{
            marginTop: 12, padding: '10px 14px',
            background: 'rgba(255,255,255,0.7)', borderRadius: 8,
            fontSize: 14, color: v.text, fontWeight: 600,
          }}>
            💰 מחיר מיקוח מומלץ: <strong>{report.negotiationPrice}</strong>
          </div>
        )}
      </div>

      {/* Report Sections */}
      {report.sections.map((sec, i) => {
        const severityColors = {
          good: { bg: '#F0FDF4', border: '#BBF7D0', dot: '#059669' },
          warning: { bg: '#FFFBEB', border: '#FDE68A', dot: '#D97706' },
          danger: { bg: '#FEF2F2', border: '#FECACA', dot: '#DC2626' },
          neutral: { bg: '#F8FAFC', border: '#E2E8F0', dot: '#94A3B8' },
        }
        const sc = severityColors[sec.severity ?? 'neutral']
        return (
          <div key={i} style={{
            background: sc.bg, border: `1px solid ${sc.border}`,
            borderRadius: 12, padding: '16px 20px', marginBottom: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: sc.dot, flexShrink: 0, display: 'inline-block',
              }} />
              <span style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>{sec.title}</span>
            </div>
            <p style={{ color: '#334155', fontSize: 14, lineHeight: 1.75, margin: 0, whiteSpace: 'pre-line' }}>
              {sec.content}
            </p>
          </div>
        )
      })}

      {/* Questions to ask seller */}
      {report.questions && report.questions.length > 0 && (
        <div style={{
          background: '#F0F9FF', border: '1px solid #BAE6FD',
          borderRadius: 12, padding: '16px 20px', marginBottom: 10,
        }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', marginBottom: 12 }}>
            ❓ שאלות לשאול את המוכר
          </div>
          {report.questions.map((q, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: '8px 0', borderBottom: i < report.questions!.length - 1 ? '1px solid #BAE6FD' : 'none',
            }}>
              <span style={{
                background: '#1B4FD8', color: '#FFFFFF', borderRadius: '50%',
                width: 22, height: 22, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>{i + 1}</span>
              <span style={{ fontSize: 14, color: '#0C4A6E', lineHeight: 1.6 }}>{q}</span>
            </div>
          ))}
        </div>
      )}

      {/* Car Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', marginBottom: 12, padding: '0 4px' }}>
            🏆 הרכבים המומלצים עבורך
          </div>
          {report.recommendations.map((rec, i) => (
            <div key={i} style={{
              background: '#FFFFFF', border: '1px solid #E2E8F0',
              borderRadius: 12, padding: '16px 20px', marginBottom: 10,
            }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1B4FD8', marginBottom: 10 }}>
                {i + 1}. {rec.model}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#059669', marginBottom: 6 }}>יתרונות</div>
                  {rec.pros.map((p, j) => (
                    <div key={j} style={{ fontSize: 13, color: '#334155', marginBottom: 3 }}>✓ {p}</div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#DC2626', marginBottom: 6 }}>חסרונות</div>
                  {rec.cons.map((c, j) => (
                    <div key={j} style={{ fontSize: 13, color: '#334155', marginBottom: 3 }}>✗ {c}</div>
                  ))}
                </div>
              </div>
              <div style={{
                background: '#F8FAFC', borderRadius: 8, padding: '8px 12px',
                fontSize: 13, color: '#475569', lineHeight: 1.6,
              }}>
                💡 {rec.tips}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div style={{
        background: '#0F1C3F', borderRadius: 16, padding: '24px',
        textAlign: 'center', marginTop: 20,
      }}>
        <p style={{ color: '#94A3B8', fontSize: 13, marginBottom: 16 }}>
          רוצה לבדוק רכב נוסף? הדוח הבא עולה ₪49
        </p>
        <button
          onClick={() => window.location.href = '/carcheck'}
          style={{
            background: '#1B4FD8', color: '#FFFFFF', border: 'none',
            borderRadius: 10, padding: '12px 28px', fontSize: 15, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          בדיקה חדשה ←
        </button>
      </div>
    </div>
  )
}

// ─── Insurance Form ───────────────────────────────────────────────────────────

function InsuranceForm({ onSubmit, loading }: { onSubmit: (data: FormData) => void; loading: boolean }) {
  const [file, setFile] = useState<File | null>(null)
  const [drag, setDrag] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f?.type === 'application/pdf') setFile(f)
  }, [])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file) return
    const fd = new FormData(e.currentTarget)
    fd.set('file', file)
    onSubmit(fd)
  }

  return (
    <form onSubmit={handleSubmit}>
      <label style={labelStyle}>העלה דוח PDF</label>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${drag ? '#1B4FD8' : file ? '#059669' : '#CBD5E1'}`,
          borderRadius: 12, padding: '32px 20px', textAlign: 'center',
          cursor: 'pointer', marginBottom: 16, transition: 'all 0.15s',
          background: drag ? '#EFF6FF' : file ? '#F0FDF4' : '#FAFAFA',
        }}
      >
        <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <div style={{ fontSize: 32, marginBottom: 8 }}>{file ? '✅' : '📄'}</div>
        <div style={{ fontSize: 14, color: file ? '#065F46' : '#64748B', fontWeight: file ? 600 : 400 }}>
          {file ? file.name : 'גרור לכאן PDF או לחץ לבחור'}
        </div>
        {!file && <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>PDF בלבד • עד 10MB</div>}
      </div>
      <label style={labelStyle}>מחיר מבוקש על הרכב (₪)</label>
      <input name="price" type="number" placeholder="לדוגמה: 75000" style={inputStyle} required />
      <SubmitButton loading={loading} disabled={!file} />
    </form>
  )
}

// ─── Garage Form ──────────────────────────────────────────────────────────────

function GarageForm({ onSubmit, loading }: { onSubmit: (data: FormData) => void; loading: boolean }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file) return
    const fd = new FormData(e.currentTarget)
    fd.set('file', file)
    onSubmit(fd)
  }

  return (
    <form onSubmit={handleSubmit}>
      <label style={labelStyle}>צלם / העלה את טופס המוסך</label>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${file ? '#059669' : '#CBD5E1'}`,
          borderRadius: 12, marginBottom: 16, overflow: 'hidden',
          cursor: 'pointer', minHeight: 140, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: preview ? '#000' : '#FAFAFA',
        }}
      >
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        {preview ? (
          <img src={preview} alt="טופס מוסך" style={{ maxHeight: 240, maxWidth: '100%', objectFit: 'contain' }} />
        ) : (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
            <div style={{ fontSize: 14, color: '#64748B' }}>לחץ להעלאת תמונה</div>
          </div>
        )}
      </div>
      <label style={labelStyle}>מחיר מבוקש (₪)</label>
      <input name="price" type="number" placeholder="לדוגמה: 60000" style={inputStyle} required />
      <SubmitButton loading={loading} disabled={!file} />
    </form>
  )
}

// ─── Specific Car Form ────────────────────────────────────────────────────────

function SpecificForm({ onSubmit, loading }: { onSubmit: (data: FormData) => void; loading: boolean }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit(new FormData(e.currentTarget))
  }
  return (
    <form onSubmit={handleSubmit}>
      <label style={labelStyle}>מספר רישוי (אופציונלי)</label>
      <input name="plate" type="text" placeholder="לדוגמה: 12-345-67" style={inputStyle} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>יצרן ודגם</label>
          <input name="model" type="text" placeholder="טויוטה קורולה" style={inputStyle} required />
        </div>
        <div>
          <label style={labelStyle}>שנת ייצור</label>
          <input name="year" type="number" placeholder="2018" min="1990" max="2025" style={inputStyle} required />
        </div>
      </div>
      <label style={labelStyle}>קילומטראז'</label>
      <input name="km" type="number" placeholder="120000" style={inputStyle} required />
      <label style={labelStyle}>מחיר מבוקש (₪)</label>
      <input name="price" type="number" placeholder="75000" style={inputStyle} required />
      <label style={labelStyle}>מידע נוסף (אופציונלי)</label>
      <textarea name="notes" placeholder="בעלויות, היסטוריה ידועה, מצב כללי..." style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
      <SubmitButton loading={loading} />
    </form>
  )
}

// ─── Budget Form ──────────────────────────────────────────────────────────────

function BudgetForm({ onSubmit, loading }: { onSubmit: (data: FormData) => void; loading: boolean }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit(new FormData(e.currentTarget))
  }
  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>תקציב מינימלי (₪)</label>
          <input name="budgetMin" type="number" placeholder="50000" style={inputStyle} required />
        </div>
        <div>
          <label style={labelStyle}>תקציב מקסימלי (₪)</label>
          <input name="budgetMax" type="number" placeholder="100000" style={inputStyle} required />
        </div>
      </div>
      <label style={labelStyle}>שימושים עיקריים</label>
      <input name="usage" type="text" placeholder="לדוגמה: נסיעות עיר, ילדים, נסיעות ארוכות..." style={inputStyle} required />
      <label style={labelStyle}>מספר נוסעים רגיל</label>
      <input name="passengers" type="number" placeholder="4" min="1" max="9" style={inputStyle} required />
      <label style={labelStyle}>העדפות</label>
      <textarea name="preferences" placeholder="חיסכון בדלק, ידנית/אוטומטית, מרחב, עלות תחזוקה נמוכה..." style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} required />
      <label style={labelStyle}>דברים שרוצה להימנע מהם</label>
      <textarea name="avoid" placeholder="לדוגמה: רכב יפני, דיזל, מעל 150,000 ק&quot;מ..." style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} />
      <SubmitButton loading={loading} />
    </form>
  )
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600,
  color: '#374151', marginBottom: 6, marginTop: 14,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', fontSize: 14,
  border: '1.5px solid #E2E8F0', borderRadius: 10, outline: 'none',
  background: '#FAFAFA', color: '#0F172A', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
  fontFamily: 'inherit',
}

function SubmitButton({ loading, disabled }: { loading: boolean; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      style={{
        width: '100%', marginTop: 20, padding: '13px',
        background: loading || disabled ? '#94A3B8' : '#1B4FD8',
        color: '#FFFFFF', border: 'none', borderRadius: 10,
        fontSize: 15, fontWeight: 700, cursor: loading || disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s',
      }}
    >
      {loading ? '⏳ מנתח...' : 'נתח עכשיו — חינם ←'}
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

function AnalyzePageContent() {
  const router = useRouter()
  const params = useSearchParams()
  const scenario = (params.get('scenario') ?? 'specific') as ScenarioId
  const config = scenarioConfig[scenario] ?? scenarioConfig.specific

  const [stage, setStage] = useState<'form' | 'loading' | 'report' | 'email'>('form')
  const [report, setReport] = useState<CarCheckReport | null>(null)
  const [email, setEmail] = useState('')
  const [pendingData, setPendingData] = useState<FormData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFormSubmit = async (fd: FormData) => {
    // Show email gate
    fd.set('scenario', scenario)
    setPendingData(fd)
    setStage('email')
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pendingData) return
    setStage('loading')
    setError(null)

    try {
      pendingData.set('email', email)

      const res = await fetch('/api/carcheck/analyze', {
        method: 'POST',
        body: pendingData,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'שגיאה בניתוח. נסה שוב.')
      }

      const data = await res.json()
      setReport(data.report)
      setStage('report')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה לא צפויה')
      setStage('form')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>
      {/* Header */}
      <header style={{ background: '#0F1C3F', borderBottom: '1px solid #1E2D5A' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.push('/carcheck')}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 20, padding: 4 }}
          >
            ←
          </button>
          <div style={{ fontSize: 20 }}>{config.icon}</div>
          <div>
            <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 15 }}>{config.title}</div>
            <div style={{ color: '#64748B', fontSize: 12 }}>{config.description}</div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>

        {/* Progress */}
        {stage !== 'report' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
            {['form', 'email', 'loading'].map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                  background: stage === s ? '#1B4FD8' : ['form', 'email'].indexOf(stage) > i ? '#059669' : '#E2E8F0',
                  color: stage === s || ['form', 'email'].indexOf(stage) > i ? '#FFFFFF' : '#94A3B8',
                }}>
                  {['form', 'email'].indexOf(stage) > i ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 13, color: stage === s ? '#1B4FD8' : '#94A3B8', fontWeight: stage === s ? 600 : 400 }}>
                  {['פרטים', 'אימייל', 'ניתוח'][i]}
                </span>
                {i < 2 && <div style={{ width: 24, height: 2, background: '#E2E8F0', borderRadius: 1 }} />}
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10,
            padding: '12px 16px', marginBottom: 16, color: '#991B1B', fontSize: 14,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Form Stage */}
        {stage === 'form' && (
          <div style={{ background: '#FFFFFF', borderRadius: 16, padding: '28px 24px', border: '1px solid #E2E8F0' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{config.title}</h2>
            <p style={{ color: '#64748B', fontSize: 14, marginBottom: 20 }}>{config.description}</p>
            {scenario === 'insurance' && <InsuranceForm onSubmit={handleFormSubmit} loading={false} />}
            {scenario === 'garage' && <GarageForm onSubmit={handleFormSubmit} loading={false} />}
            {scenario === 'specific' && <SpecificForm onSubmit={handleFormSubmit} loading={false} />}
            {scenario === 'budget' && <BudgetForm onSubmit={handleFormSubmit} loading={false} />}
          </div>
        )}

        {/* Email Gate */}
        {stage === 'email' && (
          <div style={{ background: '#FFFFFF', borderRadius: 16, padding: '36px 28px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📩</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
              לאן לשלוח את הדוח?
            </h2>
            <p style={{ color: '#64748B', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              הכנס אימייל כדי לקבל את הדוח. הדוח הראשון חינמי — לא צריך כרטיס אשראי.
            </p>
            <form onSubmit={handleEmailSubmit} style={{ maxWidth: 360, margin: '0 auto' }}>
              <input
                type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{ ...inputStyle, marginBottom: 12, textAlign: 'left', direction: 'ltr' }}
              />
              <button
                type="submit"
                style={{
                  width: '100%', padding: '13px', background: '#1B4FD8',
                  color: '#FFFFFF', border: 'none', borderRadius: 10,
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                }}
              >
                קבל דוח חינמי ←
              </button>
            </form>
            <p style={{ color: '#94A3B8', fontSize: 12, marginTop: 16 }}>
              ללא ספאם. המייל רק לשמירת הדוח.
            </p>
          </div>
        )}

        {/* Loading */}
        {stage === 'loading' && <LoadingSkeleton />}

        {/* Report */}
        {stage === 'report' && report && <ReportDisplay report={report} />}
      </div>
    </div>
  )
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#F7F8FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#64748B', fontSize: 15 }}>טוען...</div>
      </div>
    }>
      <AnalyzePageContent />
    </Suspense>
  )
}
