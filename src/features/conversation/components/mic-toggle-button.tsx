import { MicIcon, MicOffIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MicToggleButtonProps {
  isMicEnabled: boolean
  onToggleMic: () => void
}

export function MicToggleButton({ isMicEnabled, onToggleMic }: MicToggleButtonProps) {
  const label = isMicEnabled ? "Mute microphone" : "Unmute microphone"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      aria-pressed={!isMicEnabled}
      onClick={onToggleMic}
      className={cn(
        "size-11 rounded-full",
        isMicEnabled
          ? "text-muted-foreground hover:text-foreground"
          : "bg-destructive/15 text-destructive hover:bg-destructive/25"
      )}
    >
      {isMicEnabled ? <MicIcon className="size-5" /> : <MicOffIcon className="size-5" />}
    </Button>
  )
}
