import { Eye, Volume2, MousePointer, Type, Accessibility } from "lucide-react"

export const ACCESSIBILITY_OPTIONS = [
  { id: "visual", label: "Visual Impairment", icon: Eye },
  { id: "hearing", label: "Hearing Impairment", icon: Volume2 },
  { id: "mobility", label: "Mobility Impairment", icon: MousePointer },
  { id: "cognitive", label: "Cognitive Disability", icon: Type },
  { id: "other", label: "Other", icon: Accessibility },
] as const

export const ACCESSIBILITY_FEATURES = [
  "Screen Reader Support",
  "Sign Language Support", 
  "Assistive Technology Provided",
  "Remote Work Options",
  "Flexible Hours",
  "Accessible Office Space"
] as const
