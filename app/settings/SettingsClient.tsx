// app/settings/SettingsClient.tsx
"use client";

import { useState, useEffect } from "react";
import { getSettings, updateCrossfadeSettings } from "@/lib/settings";
import { CrossfadeSettings } from "@/lib/settings";

export function SettingsClient() {
  const [crossfade, setCrossfade] = useState<CrossfadeSettings>({
    enabled: false,
    duration: 5,
    prebufferTime: 10,
  });

  useEffect(() => {
    const settings = getSettings();
    setCrossfade(settings.crossfade);
  }, []);

  const handleToggleCrossfade = (enabled: boolean) => {
    updateCrossfadeSettings({ enabled });
    setCrossfade(prev => ({ ...prev, enabled }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <div className="space-y-6">
          {/* Crossfade Section */}
          <div className="border border-foreground/20 p-6">
            <h2 className="text-lg font-semibold mb-4">Audio Crossfade</h2>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Crossfade</p>
                <p className="text-sm text-foreground/60">
                  Smooth transitions between tracks
                </p>
              </div>
              <button
                onClick={() => handleToggleCrossfade(!crossfade.enabled)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  crossfade.enabled
                    ? "bg-foreground"
                    : "bg-foreground/20"
                }`}
                role="switch"
                aria-checked={crossfade.enabled}
                aria-label="Enable crossfade"
              >
                <div
                  className={`w-5 h-5 bg-background rounded-full transition-transform ${
                    crossfade.enabled ? "translate-x-6" : "translate-x-0.5"
                  }`}
                  aria-hidden="true"
                />
              </button>
            </div>

            {crossfade.enabled && (
              <div className="mt-4 pt-4 border-t border-foreground/10 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground/60">Duration</span>
                  <span className="font-mono">{crossfade.duration}s</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground/60">Pre-buffer Time</span>
                  <span className="font-mono">{crossfade.prebufferTime}s</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}