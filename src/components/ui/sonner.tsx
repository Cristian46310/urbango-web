"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-right"
      visibleToasts={5}
      richColors
      closeButton
      gap={16}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--error-bg": "rgb(254, 242, 242)",
          "--error-border": "rgb(254, 226, 226)",
          "--error-text": "rgb(127, 29, 29)",
          "--success-bg": "rgb(240, 253, 244)",
          "--success-border": "rgb(220, 252, 231)",
          "--success-text": "rgb(22, 101, 52)",
          "--warning-bg": "rgb(254, 252, 232)",
          "--warning-border": "rgb(254, 243, 199)",
          "--warning-text": "rgb(113, 63, 18)",
          "--info-bg": "rgb(239, 246, 255)",
          "--info-border": "rgb(219, 234, 254)",
          "--info-text": "rgb(30, 58, 138)",
          zIndex: 9999,
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
