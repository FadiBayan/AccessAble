"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { 
  Contrast, 
  Type, 
  Volume2, 
  VolumeX, 
  ZoomIn, 
  ZoomOut,
  Eye,
  Ear,
  Hand,
  Brain,
  X
} from "lucide-react"
import { useAccessibility } from "./accessibility-provider"

interface AccessibilitySettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AccessibilitySettingsModal({ isOpen, onClose }: AccessibilitySettingsModalProps) {
  const { settings, updateSettings } = useAccessibility()
  const { highContrast } = settings;

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, [highContrast]);

  const handleHighContrast = (enabled: boolean) => {
    updateSettings({ highContrast: enabled })
  }

  const handleLargeText = (enabled: boolean) => {
    updateSettings({ largeText: enabled })
  }

  const handleAudio = (enabled: boolean) => {
    updateSettings({ audioEnabled: enabled })
  }

  const handleZoom = (level: number) => {
    updateSettings({ zoomLevel: level })
  }



  const handleDisabilityToggle = (type: keyof typeof settings, enabled: boolean) => {
    updateSettings({ [type]: enabled })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-semibold text-charcoal">
            Accessibility Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[calc(80vh-80px)] pr-2 space-y-6">
          {/* Visual Accessibility */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-charcoal flex items-center">
              <Eye className="h-5 w-5 mr-2 text-mustard" aria-hidden="true" />
              Visual Accessibility
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Contrast className="h-4 w-4 text-mustard" aria-hidden="true" />
                  <label htmlFor="high-contrast" className="text-sm">High Contrast</label>
                </div>
                <Switch
                  id="high-contrast"
                  checked={settings.highContrast}
                  onCheckedChange={handleHighContrast}
                  aria-label="Toggle high contrast mode"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Type className="h-4 w-4 text-mustard" aria-hidden="true" />
                  <label htmlFor="large-text" className="text-sm">Large Text</label>
                </div>
                <Switch
                  id="large-text"
                  checked={settings.largeText}
                  onCheckedChange={handleLargeText}
                  aria-label="Toggle large text mode"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <ZoomIn className="h-4 w-4 text-mustard" aria-hidden="true" />
                  <label className="text-sm">Zoom Level: {settings.zoomLevel}%</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleZoom(Math.max(settings.zoomLevel - 10, 50))}
                    aria-label="Decrease zoom level by 10%"
                  >
                    <ZoomOut className="h-3 w-3" aria-hidden="true" />
                  </Button>
                  <div className="flex-1 h-2 bg-gray-200 rounded" role="progressbar" aria-valuenow={settings.zoomLevel} aria-valuemin={50} aria-valuemax={200} aria-label="Zoom level slider">
                    <div 
                      className="h-full bg-mustard rounded transition-all"
                      style={{ width: `${((settings.zoomLevel - 50) / 150) * 100}%` }}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleZoom(Math.min(settings.zoomLevel + 10, 200))}
                    aria-label="Increase zoom level by 10%"
                  >
                    <ZoomIn className="h-3 w-3" aria-hidden="true" />
                  </Button>
                </div>
              </div>


            </div>
          </div>

          {/* Audio Accessibility */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-charcoal flex items-center">
              <Ear className="h-5 w-5 mr-2 text-mustard" aria-hidden="true" />
              Audio Accessibility
            </h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {settings.audioEnabled ? (
                  <Volume2 className="h-4 w-4 text-mustard" aria-hidden="true" />
                ) : (
                  <VolumeX className="h-4 w-4 text-mustard" aria-hidden="true" />
                )}
                <label htmlFor="audio" className="text-sm">Audio</label>
              </div>
              <Switch
                id="audio"
                checked={settings.audioEnabled}
                onCheckedChange={handleAudio}
                aria-label="Toggle audio accessibility features"
              />
            </div>
          </div>

          {/* Disability Profile */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-charcoal">Disability Profile</h3>
            <p className="text-sm text-gray-600">
              Help us personalize your experience by sharing your accessibility needs.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-mustard" aria-hidden="true" />
                  <label htmlFor="visual-impairment" className="text-sm">Visual Impairment</label>
                </div>
                <Switch
                  id="visual-impairment"
                  checked={settings.visualImpairment}
                  onCheckedChange={(enabled) => handleDisabilityToggle('visualImpairment', enabled)}
                  aria-label="Toggle visual impairment accommodation"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Ear className="h-4 w-4 text-mustard" aria-hidden="true" />
                  <label htmlFor="hearing-impairment" className="text-sm">Hearing Impairment</label>
                </div>
                <Switch
                  id="hearing-impairment"
                  checked={settings.hearingImpairment}
                  onCheckedChange={(enabled) => handleDisabilityToggle('hearingImpairment', enabled)}
                  aria-label="Toggle hearing impairment accommodation"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Hand className="h-4 w-4 text-mustard" aria-hidden="true" />
                  <label htmlFor="motor-impairment" className="text-sm">Motor Impairment</label>
                </div>
                <Switch
                  id="motor-impairment"
                  checked={settings.motorImpairment}
                  onCheckedChange={(enabled) => handleDisabilityToggle('motorImpairment', enabled)}
                  aria-label="Toggle motor impairment accommodation"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Brain className="h-4 w-4 text-mustard" aria-hidden="true" />
                  <label htmlFor="cognitive-impairment" className="text-sm">Cognitive Impairment</label>
                </div>
                <Switch
                  id="cognitive-impairment"
                  checked={settings.cognitiveImpairment}
                  onCheckedChange={(enabled) => handleDisabilityToggle('cognitiveImpairment', enabled)}
                  aria-label="Toggle cognitive impairment accommodation"
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 