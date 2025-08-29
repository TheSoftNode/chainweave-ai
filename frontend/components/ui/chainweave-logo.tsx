"use client"

import * as React from "react"
import Link from "next/link"
import { motion, type Variants } from "framer-motion"
import { cn } from "@/lib/utils"

interface ChainWeaveLogoProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  variant?: "default" | "white" | "dark"
  animated?: boolean
  href?: string
  linkClassName?: string
}

const sizeMap = {
  sm: { logo: "w-6 h-6", text: "text-sm" },
  md: { logo: "w-8 h-8", text: "text-base" },
  lg: { logo: "w-10 h-10", text: "text-lg" },
  xl: { logo: "w-12 h-12", text: "text-xl" }
}

export function ChainWeaveLogo({ 
  className,
  size = "md",
  showText = true,
  variant = "default",
  animated = true,
  href = "/",
  linkClassName
}: ChainWeaveLogoProps) {
  const { logo: logoSize, text: textSize } = sizeMap[size]

  const logoVariants: Variants = {
    initial: { 
      scale: 0.8, 
      opacity: 0,
      rotate: -10
    },
    animate: { 
      scale: 1, 
      opacity: 1,
      rotate: 0,
      transition: {
        duration: 0.6
      }
    },
    hover: {
      scale: 1.05,
      rotate: 5,
      transition: {
        duration: 0.2
      }
    }
  }

  const textVariants: Variants = {
    initial: { 
      x: -20, 
      opacity: 0 
    },
    animate: { 
      x: 0, 
      opacity: 1,
      transition: {
        duration: 0.6,
        delay: 0.2
      }
    }
  }

  const getTextColor = () => {
    switch (variant) {
      case "white":
        return "text-white"
      case "dark":
        return "text-gray-900"
      default:
        return "text-foreground"
    }
  }

  const LogoIcon = () => (
    <motion.div
      variants={animated ? logoVariants : undefined}
      initial={animated ? "initial" : undefined}
      animate={animated ? "animate" : undefined}
      whileHover={animated ? "hover" : undefined}
      className={cn(
        logoSize,
        "relative flex items-center justify-center rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-[hsl(var(--zeta-green))] via-[hsl(var(--zeta-teal))] to-[hsl(var(--zeta-blue))]",
        "shadow-xl shadow-[hsl(var(--zeta-green))]/20",
        "border border-white/20",
        "before:absolute before:inset-0 before:bg-gradient-to-tr before:from-transparent before:via-white/10 before:to-transparent",
        "after:absolute after:inset-0 after:bg-gradient-to-bl after:from-transparent after:via-black/5 after:to-transparent"
      )}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--zeta-green))]/20 via-[hsl(var(--zeta-teal))]/20 to-[hsl(var(--zeta-blue))]/20 animate-pulse" />
      
      {/* Main logo symbol */}
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        <svg
          viewBox="0 0 24 24"
          className="w-3/5 h-3/5 text-white drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Stylized chain links representing blockchain */}
          <g className="drop-shadow-sm">
            <circle
              cx="8"
              cy="8"
              r="2.5"
              fill="currentColor"
              opacity="0.95"
              className="animate-pulse"
              style={{ animationDelay: "0s", animationDuration: "3s" }}
            />
            <circle
              cx="16"
              cy="8"
              r="2.5"
              fill="currentColor"
              opacity="0.95"
              className="animate-pulse"
              style={{ animationDelay: "0.5s", animationDuration: "3s" }}
            />
            <circle
              cx="8"
              cy="16"
              r="2.5"
              fill="currentColor"
              opacity="0.95"
              className="animate-pulse"
              style={{ animationDelay: "1s", animationDuration: "3s" }}
            />
            <circle
              cx="16"
              cy="16"
              r="2.5"
              fill="currentColor"
              opacity="0.95"
              className="animate-pulse"
              style={{ animationDelay: "1.5s", animationDuration: "3s" }}
            />
          </g>
          
          {/* Enhanced connecting lines with gradient effect */}
          <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.9">
            <path d="M10.5 8h3" className="drop-shadow-sm" />
            <path d="M10.5 16h3" className="drop-shadow-sm" />
            <path d="M8 10.5v3" className="drop-shadow-sm" />
            <path d="M16 10.5v3" className="drop-shadow-sm" />
          </g>
          
          {/* AI neural network overlay with enhanced design */}
          <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7">
            <path d="M12 2v4" className="drop-shadow-sm animate-pulse" style={{ animationDelay: "2s", animationDuration: "4s" }} />
            <path d="M12 18v4" className="drop-shadow-sm animate-pulse" style={{ animationDelay: "2.5s", animationDuration: "4s" }} />
            <path d="M2 12h4" className="drop-shadow-sm animate-pulse" style={{ animationDelay: "3s", animationDuration: "4s" }} />
            <path d="M18 12h4" className="drop-shadow-sm animate-pulse" style={{ animationDelay: "3.5s", animationDuration: "4s" }} />
          </g>
          
          {/* Central AI core */}
          <circle
            cx="12"
            cy="12"
            r="2"
            fill="currentColor"
            opacity="0.95"
            className="drop-shadow-md animate-pulse"
            style={{ animationDelay: "0.25s", animationDuration: "2s" }}
          />
          
          {/* Subtle connecting dots */}
          <g fill="currentColor" opacity="0.6">
            <circle cx="6" cy="6" r="0.5" className="animate-pulse" style={{ animationDelay: "4s", animationDuration: "5s" }} />
            <circle cx="18" cy="6" r="0.5" className="animate-pulse" style={{ animationDelay: "4.2s", animationDuration: "5s" }} />
            <circle cx="6" cy="18" r="0.5" className="animate-pulse" style={{ animationDelay: "4.4s", animationDuration: "5s" }} />
            <circle cx="18" cy="18" r="0.5" className="animate-pulse" style={{ animationDelay: "4.6s", animationDuration: "5s" }} />
          </g>
        </svg>
      </div>

      {/* Enhanced shine effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Subtle inner glow */}
      <div className="absolute inset-1 rounded-xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
    </motion.div>
  )

  const LogoContent = () => (
    <div className={cn("flex items-center space-x-2 group", className)}>
      <LogoIcon />
      
      {showText && (
        <motion.div
          variants={animated ? textVariants : undefined}
          initial={animated ? "initial" : undefined}
          animate={animated ? "animate" : undefined}
          className="flex flex-col"
        >
          <span className={cn(
            "font-bold leading-tight tracking-tight",
            textSize,
            getTextColor()
          )}>
            ChainWeave
          </span>
          <span className={cn(
            "text-xs font-medium leading-none tracking-wider opacity-80",
            variant === "white" ? "text-white/80" : 
            variant === "dark" ? "text-gray-600" : "text-muted-foreground"
          )}>
            AI
          </span>
        </motion.div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link 
        href={href} 
        className={cn(
          "inline-flex items-center transition-opacity hover:opacity-80 focus:opacity-80 focus:outline-none",
          linkClassName
        )}
      >
        <LogoContent />
      </Link>
    )
  }

  return <LogoContent />
}

// Compact version for smaller spaces
export function ChainWeaveLogoCompact({ 
  className,
  size = "sm",
  variant = "default",
  href = "/",
  linkClassName
}: Omit<ChainWeaveLogoProps, 'showText'>) {
  const LogoContent = () => (
    <ChainWeaveLogo 
      className={className}
      size={size}
      showText={false}
      variant={variant}
      animated={false}
      href="" // Disable inner link since we handle it here
    />
  )

  if (href) {
    return (
      <Link 
        href={href} 
        className={cn(
          "inline-flex items-center transition-opacity hover:opacity-80 focus:opacity-80 focus:outline-none",
          linkClassName
        )}
      >
        <LogoContent />
      </Link>
    )
  }

  return <LogoContent />
}

// Icon-only version
export function ChainWeaveIcon({ 
  className,
  size = 24,
  href = "/",
  linkClassName
}: { 
  className?: string
  size?: number
  href?: string
  linkClassName?: string
}) {
  const IconContent = () => (
    <div 
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`chainweave-gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--zeta-green))" />
            <stop offset="50%" stopColor="hsl(var(--zeta-teal))" />
            <stop offset="100%" stopColor="hsl(var(--zeta-blue))" />
          </linearGradient>
        </defs>
        
        {/* Stylized chain links */}
        <g fill={`url(#chainweave-gradient-${size})`} opacity="0.9">
          <circle cx="8" cy="8" r="2.5" />
          <circle cx="16" cy="8" r="2.5" />
          <circle cx="8" cy="16" r="2.5" />
          <circle cx="16" cy="16" r="2.5" />
        </g>
        
        {/* Connecting lines */}
        <g stroke={`url(#chainweave-gradient-${size})`} strokeWidth="2" strokeLinecap="round" opacity="0.8">
          <path d="M10.5 8h3" />
          <path d="M10.5 16h3" />
          <path d="M8 10.5v3" />
          <path d="M16 10.5v3" />
        </g>
        
        {/* AI neural network overlay */}
        <g stroke={`url(#chainweave-gradient-${size})`} strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
          <path d="M12 2v4" />
          <path d="M12 18v4" />
          <path d="M2 12h4" />
          <path d="M18 12h4" />
        </g>
        
        {/* Central core */}
        <circle
          cx="12"
          cy="12"
          r="2"
          fill={`url(#chainweave-gradient-${size})`}
          opacity="0.9"
        />
      </svg>
    </div>
  )

  if (href) {
    return (
      <Link 
        href={href} 
        className={cn(
          "inline-flex items-center transition-opacity hover:opacity-80 focus:opacity-80 focus:outline-none",
          linkClassName
        )}
      >
        <IconContent />
      </Link>
    )
  }

  return <IconContent />
}
