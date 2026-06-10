import { useState, type KeyboardEvent } from "react";
import { MapPin, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatComposerProps {
  loading: boolean;
  maxBodyLength: number;
  disabled?: boolean;
  onSend: (payload: {
    body: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<boolean>;
}

export function ChatComposer({
  loading,
  maxBodyLength,
  disabled = false,
  onSend,
}: ChatComposerProps) {
  const [body, setBody] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [locating, setLocating] = useState(false);

  const handleUseLocation = () => {
    if (!navigator.geolocation) return;

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSend = async () => {
    const sent = await onSend({ body, latitude, longitude });
    if (sent) {
      setBody("");
      setLatitude(undefined);
      setLongitude(undefined);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!loading && body.trim() && !disabled) {
        void handleSend();
      }
    }
  };

  return (
    <div className="border-t border-(--security-border) bg-card p-4">
      <div className="flex flex-col gap-3">
        <Textarea
          value={body}
          onChange={(e) => { setBody(e.target.value.slice(0, maxBodyLength)); }}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder="Escribe un mensaje..."
          disabled={disabled || loading}
          className="min-h-[72px] resize-none"
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseLocation}
              disabled={disabled || loading || locating}
            >
              <MapPin className="size-4" />
              {locating ? "Ubicando..." : "Ubicación"}
            </Button>
            {latitude != null && longitude != null ? (
              <span className="text-xs text-muted-foreground">
                {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </span>
            ) : null}
          </div>

          <Button
            type="button"
            onClick={() => { void handleSend(); }}
            disabled={disabled || loading || !body.trim()}
          >
            <Send className="size-4" />
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}
