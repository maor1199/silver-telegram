import Link from "next/link"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  linkToHome?: boolean
}

export function Logo({ size = "md", linkToHome = true }: LogoProps) {
  // Size mappings for the icon container and text
  const sizeConfig = {
    sm: { container: "w-10 h-10", sLetter: "text-[36px]", title: "text-base", subtitle: "text-[10px]", gap: "gap-2" },
    md: { container: "w-12 h-12", sLetter: "text-[44px]", title: "text-xl", subtitle: "text-[11px]", gap: "gap-3" },
    lg: { container: "w-14 h-14", sLetter: "text-[52px]", title: "text-2xl", subtitle: "text-xs", gap: "gap-3" },
  }

  const config = sizeConfig[size]

  const content = (
    <div className={`flex items-center ${config.gap} select-none`}>
      {/* Icon Container */}
      <div className={`relative ${config.container} shrink-0 flex items-center justify-center`}>
        {/* The S letter - large, straight, Amazon orange color */}
        <span className={`text-[#F59E0B] font-black ${config.sLetter} leading-none z-10`}>
          S
        </span>
        
        {/* The rising graph - SVG overlay on top of the letter */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full z-20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Graph line - starts from bottom left and rises to top right */}
          <path
            d="M20 75C35 70 55 55 75 25"
            stroke="#1E2A44"
            strokeWidth="6"
            strokeLinecap="round"
            className="drop-shadow-sm"
          />
          {/* Arrow head */}
          <path 
            d="M68 25L78 22L76 33" 
            fill="#1E2A44" 
          />
        </svg>
      </div>

      {/* Logo text */}
      <div className="leading-tight">
        <div className={`text-[#1E2A44] font-bold ${config.title} tracking-tighter`}>
          SellerMentor
        </div>
        <div className={`text-gray-500 ${config.subtitle} font-medium uppercase tracking-wider`}>
          AI Product Intelligence
        </div>
      </div>
    </div>
  )

  if (linkToHome) {
    return <Link href="/">{content}</Link>
  }

  return content
}
