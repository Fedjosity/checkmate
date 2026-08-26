"use client";

import React, { useState, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { updateMe } from "@/lib/api/users";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import CasinoIcon from "@mui/icons-material/Casino";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

// Curated avatar presets with high aesthetic appeal
const PRESET_AVATARS = [
  { id: "knight_1", label: "Golden Knight", url: "https://api.dicebear.com/7.x/bottts/svg?seed=knight_gold&backgroundColor=121212" },
  { id: "queen_1", label: "Crown Queen", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=crown_queen&backgroundColor=1e1b18" },
  { id: "king_1", label: "Grandmaster King", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=gm_king&backgroundColor=171412" },
  { id: "tactician_1", label: "Cyber Tactician", url: "https://api.dicebear.com/7.x/bottts/svg?seed=tactician_cyber&backgroundColor=0f141c" },
  { id: "blitz_1", label: "Lightning Master", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=blitz_lightning&backgroundColor=141414" },
  { id: "pixel_1", label: "Retro Champion", url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=pixel_champ&backgroundColor=1a1a1a" },
  { id: "scholar_1", label: "Chess Scholar", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=scholar_sage&backgroundColor=1a1612" },
  { id: "rogue_1", label: "Rogue Gambiteer", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=rogue_gambit&backgroundColor=1c1515" },
];

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string | null;
  onAvatarUpdated?: (newUrl: string) => void;
}

export function AvatarPickerModal({
  isOpen,
  onClose,
  currentAvatarUrl,
  onAvatarUpdated,
}: AvatarPickerModalProps) {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"presets" | "random" | "upload">("presets");
  const [selectedPresetUrl, setSelectedPresetUrl] = useState<string>(
    currentAvatarUrl || PRESET_AVATARS[0].url
  );
  const [randomSeed, setRandomSeed] = useState<string>(() => `seed_${Date.now()}`);
  const [randomStyle, setRandomStyle] = useState<string>("avataaars");
  const [isSaving, setIsSaving] = useState(false);
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customPreview, setCustomPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generatedRandomUrl = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}&backgroundColor=141414`;

  // Generate new random seed
  const handleRollDice = () => {
    const styles = ["avataaars", "bottts", "lorelei", "adventurer", "pixel-art"];
    const randomPickedStyle = styles[Math.floor(Math.random() * styles.length)];
    setRandomStyle(randomPickedStyle);
    setRandomSeed(`seed_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`);
  };

  // Download SVG or Image directly to device
  const handleDownload = async (url: string, filename: string) => {
    try {
      toast.info("Downloading avatar...");
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      toast.success("Avatar downloaded!");
    } catch (err) {
      toast.error("Failed to download avatar image.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be smaller than 5MB");
        return;
      }
      setCustomFile(file);
      setCustomPreview(URL.createObjectURL(file));
    }
  };

  const handleApplyAvatar = async () => {
    setIsSaving(true);
    try {
      let finalAvatarUrl: string | undefined;

      if (activeTab === "upload") {
        if (!customFile) {
          toast.error("Please select a file to upload");
          setIsSaving(false);
          return;
        }
        const res: any = await updateMe({ avatarFile: customFile });
        finalAvatarUrl = res?.data?.user?.avatarUrl;
      } else if (activeTab === "random") {
        finalAvatarUrl = generatedRandomUrl;
        const res: any = await updateMe({ avatarUrl: finalAvatarUrl });
        finalAvatarUrl = res?.data?.user?.avatarUrl || finalAvatarUrl;
      } else {
        finalAvatarUrl = selectedPresetUrl;
        const res: any = await updateMe({ avatarUrl: finalAvatarUrl });
        finalAvatarUrl = res?.data?.user?.avatarUrl || finalAvatarUrl;
      }

      if (user && finalAvatarUrl) {
        setUser({
          ...user,
          avatarUrl: finalAvatarUrl,
        });
      }

      if (finalAvatarUrl && onAvatarUpdated) {
        onAvatarUpdated(finalAvatarUrl);
      }

      toast.success("Avatar updated successfully!");
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to update avatar";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl bg-surface border-border/80 p-0 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border/50 bg-surface-light/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
            <AutoAwesomeIcon />
          </div>
          <div>
            <h2 className="text-xl font-headline font-bold text-white">Avatar Customizer</h2>
            <p className="text-sm text-on-surface-variant">
              Choose a curated chess preset, generate a unique vector avatar, or upload your own photo.
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 mt-5 p-1 bg-black/40 rounded-xl border border-border/40">
          <button
            onClick={() => setActiveTab("presets")}
            className={cn(
              "flex-1 py-2 text-xs font-semibold rounded-lg transition-all text-center",
              activeTab === "presets"
                ? "bg-gold text-background shadow-lg font-bold"
                : "text-on-surface-variant hover:text-white"
            )}
          >
            Curated Presets
          </button>
          <button
            onClick={() => setActiveTab("random")}
            className={cn(
              "flex-1 py-2 text-xs font-semibold rounded-lg transition-all text-center",
              activeTab === "random"
                ? "bg-gold text-background shadow-lg font-bold"
                : "text-on-surface-variant hover:text-white"
            )}
          >
            🎲 Dice Generator
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={cn(
              "flex-1 py-2 text-xs font-semibold rounded-lg transition-all text-center",
              activeTab === "upload"
                ? "bg-gold text-background shadow-lg font-bold"
                : "text-on-surface-variant hover:text-white"
            )}
          >
            📸 Custom Upload
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-6 max-h-[60vh] overflow-y-auto">
        {/* Presets Tab */}
        {activeTab === "presets" && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-4">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = selectedPresetUrl === preset.url;
                return (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedPresetUrl(preset.url)}
                    className={cn(
                      "group relative flex flex-col items-center gap-2 p-3 rounded-2xl border cursor-pointer transition-all duration-200",
                      isSelected
                        ? "bg-gold/15 border-gold shadow-[0_0_15px_rgba(201,168,76,0.25)] scale-[1.03]"
                        : "bg-surface-light/40 border-border/50 hover:border-gold/50 hover:bg-surface-light"
                    )}
                  >
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black/60 border border-border/40">
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute top-1 right-1 text-gold bg-black/70 rounded-full p-0.5">
                          <CheckCircleIcon fontSize="inherit" style={{ fontSize: "14px" }} />
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-white text-center line-clamp-1">
                      {preset.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(selectedPresetUrl, "checkmate_preset_avatar.svg")}
                className="text-xs border border-border/60 text-on-surface-variant hover:text-white flex items-center gap-1.5"
              >
                <DownloadIcon fontSize="small" />
                Download Selected Preset
              </Button>
            </div>
          </div>
        )}

        {/* Random Generator Tab */}
        {activeTab === "random" && (
          <div className="flex flex-col items-center justify-center py-6 space-y-6">
            <div className="relative group">
              <div className="w-36 h-36 rounded-3xl overflow-hidden border-2 border-gold/60 shadow-[0_0_30px_rgba(201,168,76,0.25)] bg-black/80 p-2 transition-transform duration-300 group-hover:scale-105">
                <img src={generatedRandomUrl} alt="Random avatar" className="w-full h-full object-contain" />
              </div>
              <button
                onClick={handleRollDice}
                title="Roll New Avatar"
                className="absolute -bottom-2 -right-2 p-2.5 bg-gold text-background rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
              >
                <CasinoIcon fontSize="small" />
              </button>
            </div>

            <div className="text-center space-y-1 max-w-sm">
              <h4 className="text-white font-headline font-medium text-sm">Procedural Vector Generator</h4>
              <p className="text-xs text-on-surface-variant">
                Every roll algorithmically mixes accessories, facial expressions, and palettes.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={handleRollDice}
                className="flex items-center gap-2 border border-gold/40 text-gold hover:bg-gold/10"
              >
                <CasinoIcon fontSize="small" />
                Roll New Avatar
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleDownload(generatedRandomUrl, `checkmate_avatar_${randomSeed}.svg`)}
                className="flex items-center gap-2 border border-border/60 text-white hover:bg-surface-light"
              >
                <DownloadIcon fontSize="small" />
                Download SVG
              </Button>
            </div>
          </div>
        )}

        {/* Custom Upload Tab */}
        {activeTab === "upload" && (
          <div className="space-y-4 py-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border/80 hover:border-gold/60 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-surface-light/20 hover:bg-surface-light/40 group"
            >
              {customPreview ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-gold shadow-lg">
                    <img src={customPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs text-gold font-medium">Click to choose another photo</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gold/10 text-gold flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CloudUploadIcon fontSize="large" />
                  </div>
                  <span className="text-sm font-medium text-white">Click or drag image here</span>
                  <span className="text-xs text-on-surface-variant">PNG, JPG or WebP up to 5MB</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-border/50 bg-surface-light/40 flex items-center justify-between">
        <Button variant="ghost" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleApplyAvatar}
          disabled={isSaving}
          className="bg-gold text-background hover:bg-gold-light font-bold px-6"
        >
          {isSaving ? "Saving Avatar..." : "Save as Profile Picture"}
        </Button>
      </div>
    </Modal>
  );
}
