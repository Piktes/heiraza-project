"use client";

import { useState, useEffect } from "react";
import { PopupCard } from "@/components/ui/popup-card";

interface SpecialEvent {
  id: number;
  title: string;
  message: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  linkText?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  showOnce?: boolean;
}

interface SpecialEventPopupProps {
  event: SpecialEvent | null;
}

export function SpecialEventPopup({ event }: SpecialEventPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!event) return;

    // Check if event is within date range
    const now = new Date();
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);

    if (now < start || now > end) return;

    // Check if already shown (for showOnce events)
    if (event.showOnce) {
      const shownKey = `special-event-${event.id}-shown`;
      if (sessionStorage.getItem(shownKey)) return;
      sessionStorage.setItem(shownKey, "true");
    }

    // Show popup after a short delay
    const timer = setTimeout(() => {
      setIsOpen(true);
      setIsAnimating(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [event]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => setIsOpen(false), 300);
  };

  if (!isOpen || !event) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${isAnimating ? "opacity-100" : "opacity-0"
        }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal - Using shared PopupCard component */}
      <div
        className={`relative transform transition-all duration-300 ${isAnimating ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
          }`}
      >
        <PopupCard
          title={event.title}
          message={event.message}
          imageUrl={event.imageUrl}
          linkUrl={event.linkUrl}
          linkText={event.linkText}
          onClose={handleClose}
          showCloseButton={true}
          variant="default"
        />
      </div>
    </div>
  );
}
