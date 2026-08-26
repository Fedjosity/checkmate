"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CountrySelect } from "@/components/utils/CountryDropdowns";
import { updateMe } from "@/lib/api/users";
import { useAuthStore } from "@/store/auth.store";
import { AvatarPickerModal } from "./AvatarPickerModal";
import { toast } from "sonner";
import EditIcon from "@mui/icons-material/Edit";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  onProfileUpdated,
}: EditProfileModalProps) {
  const { user, setUser } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [country, setCountry] = useState(user?.country || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl || null);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Display name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const res: any = await updateMe({
        displayName: displayName.trim(),
        bio: bio.trim(),
        country,
        avatarUrl: avatarUrl || undefined,
      });

      if (user) {
        setUser({
          ...user,
          displayName: displayName.trim(),
          bio: bio.trim(),
          country,
          avatarUrl: avatarUrl || user.avatarUrl,
        });
      }

      toast.success("Profile updated successfully!");
      if (onProfileUpdated) onProfileUpdated();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to update profile";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg bg-surface border-border/80">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border/50">
            <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center border border-gold/30">
              <EditIcon fontSize="small" />
            </div>
            <div>
              <h2 className="text-xl font-headline font-bold text-white">Edit Profile</h2>
              <p className="text-xs text-on-surface-variant">Update your public presence, bio, and avatar</p>
            </div>
          </div>

          {/* Avatar Preview & Trigger */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-light/40 border border-border/50">
            <div className="relative group cursor-pointer" onClick={() => setIsAvatarPickerOpen(true)}>
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-gold shadow-md bg-black/60">
                <img
                  src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                <PhotoCameraIcon fontSize="small" />
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-semibold text-white">Profile Avatar</h4>
              <p className="text-xs text-on-surface-variant">Choose from presets, dice generator, or upload.</p>
              <button
                type="button"
                onClick={() => setIsAvatarPickerOpen(true)}
                className="text-xs text-gold hover:underline font-semibold"
              >
                Change Avatar →
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-on-surface-variant mb-1.5">
                Display Name
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Grandmaster..."
                maxLength={40}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-on-surface-variant mb-1.5">
                Bio / Status
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tactical player, streaming daily..."
                maxLength={160}
                rows={3}
                className="w-full bg-background border border-border/80 hover:border-gold/40 focus:border-gold rounded-xl p-3 text-sm text-white focus:outline-none transition-colors"
              />
              <span className="block text-[11px] text-right text-on-surface-variant">
                {bio.length}/160
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-on-surface-variant mb-1.5">
                Country
              </label>
              <CountrySelect value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSaving}
              className="bg-gold text-background hover:bg-gold-light font-bold"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Nested Avatar Picker Modal */}
      <AvatarPickerModal
        isOpen={isAvatarPickerOpen}
        onClose={() => setIsAvatarPickerOpen(false)}
        currentAvatarUrl={avatarUrl}
        onAvatarUpdated={(newUrl) => {
          setAvatarUrl(newUrl);
        }}
      />
    </>
  );
}
