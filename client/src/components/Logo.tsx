export function Logo() {
  return (
    <div className="flex items-center gap-3 select-none">
      {/* Icon Container - ה-S עם הגרף */}
      <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
        {/* האות S - גדולה, ישרה ובצבע אמזון (F59E0B) */}
        <span className="absolute inset-0 flex items-center justify-center text-[#F59E0B] font-black text-[38px] leading-none z-10">
          S
        </span>

        {/* גרף עולה (חץ) שיושב בשכבה מעל האות */}
        <svg
          viewBox="0 0 80 80"
          className="absolute inset-0 w-full h-full z-20 pointer-events-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* קו הגרף - עולה משמאל לימין */}
          <path
            d="M15 65C30 60 45 45 62 18"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="6"
            strokeLinecap="round"
            className="drop-shadow-sm"
          />
          {/* ראש החץ */}
          <path d="M58 18L68 16L65 26" fill="rgba(255,255,255,0.9)" />
        </svg>
      </div>

      {/* טקסט הלוגו - SellerMentor (לבן בהדר כהה) */}
      <div className="leading-tight">
        <div className="text-white font-bold text-xl tracking-tight">
          SellerMentor
        </div>
      </div>
    </div>
  );
}
