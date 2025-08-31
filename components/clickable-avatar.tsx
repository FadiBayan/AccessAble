"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfilePictureViewer } from "@/components/profile-picture-viewer"

interface ClickableAvatarProps {
  src?: string
  alt: string
  fallback: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function ClickableAvatar({ 
  src, 
  alt, 
  fallback, 
  size = "md",
  className = "" 
}: ClickableAvatarProps) {
  const [showProfilePicture, setShowProfilePicture] = useState(false)

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10", 
    lg: "w-16 h-16",
    xl: "w-24 h-24"
  }

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowProfilePicture(true)
  }

  const handleAvatarKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setShowProfilePicture(true)
    }
  }

  return (
    <>
      <Avatar 
        className={`${sizeClasses[size]} cursor-pointer hover:ring-4 transition-all ${className}`}
        onClick={handleAvatarClick}
        onKeyDown={handleAvatarKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`View ${alt}'s profile picture`}
      >
        <AvatarImage src={src || '/placeholder-user.jpg'} alt={alt} />
        <AvatarFallback>{fallback[0]}</AvatarFallback>
      </Avatar>

      <ProfilePictureViewer
        isOpen={showProfilePicture}
        onClose={() => setShowProfilePicture(false)}
        avatarUrl={src}
        userName={alt}
      />
    </>
  )
}
