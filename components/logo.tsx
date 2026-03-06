import Link from "next/link"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  linkToHome?: boolean
}

export function Logo({ size = "md", linkToHome = true }: LogoProps) {
  // Height mappings for different sizes
  const sizeConfig = {
    sm: "h-8",
    md: "h-10",
    lg: "h-12",
  }

  const content = (
    <img 
      src="/images/logo.png" 
      alt="SellerMentor Logo" 
      className={`${sizeConfig[size]} w-auto`}
    />
  )

  if (linkToHome) {
    return <Link href="/">{content}</Link>
  }

  return content
}
