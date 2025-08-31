"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAccessibility } from "@/components/accessibility-provider"

interface ProfilePictureViewerProps {
  isOpen: boolean
  onClose: () => void
  avatarUrl?: string
  userName: string
}

export function ProfilePictureViewer({ 
  isOpen, 
  onClose, 
  avatarUrl, 
  userName 
}: ProfilePictureViewerProps) {
  const { settings } = useAccessibility()
  const isDarkMode = settings.highContrast

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-md ${isDarkMode ? 'bg-[#1f2937] text-white border-white/10' : ''}`}>
        <DialogHeader>
          <DialogTitle className={isDarkMode ? 'text-white' : ''}>
            {userName}'s Profile Picture
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 p-6">
          <Avatar className="w-48 h-48 rounded-full ring-4 ring-mustard shadow-lg">
            <AvatarImage 
              src={avatarUrl || '/placeholder-user.jpg'} 
              alt={`${userName}'s profile picture`}
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-mustard to-forest-green text-white text-6xl">
              {userName[0]}
            </AvatarFallback>
          </Avatar>
          
          <div className="text-center">
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-foreground'}`}>
              {userName}
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-muted-foreground'}`}>
              Profile Picture
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
