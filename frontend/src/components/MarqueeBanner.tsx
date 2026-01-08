// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Megaphone, ExternalLink, X, ChevronLeft, ChevronRight, Star, GraduationCap, Bell, Pause, Play } from 'lucide-react';

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  priority: number;
  link_url?: string;
  link_text?: string;
  portfolio_id?: string;
}

interface MarqueeBannerProps {
  userRole?: string;
}

export default function MarqueeBanner({ userRole = 'ALL' }: MarqueeBannerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
    // Har 30 sekundda yangilash
    const interval = setInterval(fetchAnnouncements, 30000);
    return () => clearInterval(interval);
  }, [userRole]);

  // E'lonlar o'zgarganda currentIndex ni to'g'rilash
  useEffect(() => {
    if (announcements.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= announcements.length) {
      setCurrentIndex(0);
    }
  }, [announcements.length, currentIndex]);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`/api/announcements/marquee?role=${userRole}`);
      const data = await res.json();
      if (data.announcements) {
        setAnnouncements(data.announcements);
        // E'lonlar o'chirilgan bo'lsa, indexni to'g'rilash
        if (data.announcements.length === 0) {
          setCurrentIndex(0);
        }
      }
    } catch (err) {
      console.error('Failed to fetch announcements');
    }
  };

  // Keyingi e'longa o'tish
  const nextAnnouncement = useCallback(() => {
    if (announcements.length <= 1) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
      setIsAnimating(false);
    }, 300);
  }, [announcements.length]);

  // Oldingi e'longa o'tish
  const prevAnnouncement = useCallback(() => {
    if (announcements.length <= 1) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
      setIsAnimating(false);
    }, 300);
  }, [announcements.length]);

  // Avtomatik o'tish - har 8 sekundda
  useEffect(() => {
    if (isPaused || announcements.length <= 1) return;
    
    const autoSlide = setInterval(() => {
      nextAnnouncement();
    }, 8000);

    return () => clearInterval(autoSlide);
  }, [isPaused, announcements.length, nextAnnouncement]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'portfolio_highlight':
        return <Star className="w-4 h-4 text-yellow-300" />;
      case 'university_news':
        return <GraduationCap className="w-4 h-4 text-blue-300" />;
      case 'announcement':
        return <Bell className="w-4 h-4 text-green-300" />;
      case 'news':
      default:
        return <Megaphone className="w-4 h-4 text-white/80" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'portfolio_highlight':
        return 'Portfolio';
      case 'university_news':
        return 'Universitet';
      case 'announcement':
        return 'E\'lon';
      case 'news':
      default:
        return 'Yangilik';
    }
  };

  // E'lonlar yo'q yoki ko'rinmas bo'lsa
  if (!isVisible || announcements.length === 0) return null;

  // currentIndex chegaradan chiqmasligi uchun
  const safeIndex = Math.min(currentIndex, announcements.length - 1);
  const currentAnnouncement = announcements[safeIndex];

  // currentAnnouncement undefined bo'lsa
  if (!currentAnnouncement) return null;

  return (
    <div className="relative bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white overflow-hidden shadow-lg">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative flex items-stretch min-h-[56px] sm:min-h-[60px] md:min-h-[48px] py-1.5 sm:py-2">
        {/* Left badge */}
        <div className="flex-shrink-0 bg-red-800/50 px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2 z-10 border-r border-red-500/30 self-stretch">
          <Megaphone className="w-3.5 sm:w-4 h-3.5 sm:h-4 animate-pulse" />
          <span className="text-[10px] sm:text-xs font-semibold tracking-wide hidden md:inline">E'LONLAR</span>
        </div>

        {/* Navigation - Previous */}
        {announcements.length > 1 && (
          <button
            onClick={prevAnnouncement}
            className="flex-shrink-0 p-1 sm:p-1.5 md:p-2 hover:bg-red-800/50 transition-colors z-10"
            title="Oldingi"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Announcement content */}
        <div 
          className="flex-1 overflow-hidden px-2 md:px-4 min-w-0"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div 
            className={`transition-all duration-300 ${isAnimating ? 'opacity-0 transform -translate-y-2' : 'opacity-100 transform translate-y-0'}`}
          >
            {/* Title row */}
            <div className="flex items-center gap-1 md:gap-2 flex-wrap">
              <span className="flex-shrink-0">{getTypeIcon(currentAnnouncement.type)}</span>
              <span className="px-1.5 md:px-2 py-0.5 bg-white/20 rounded text-[10px] md:text-xs font-medium flex-shrink-0">
                {getTypeBadge(currentAnnouncement.type)}
              </span>
              <span className="font-semibold text-xs md:text-sm break-words">
                {currentAnnouncement.title}
              </span>
              {currentAnnouncement.link_url && (
                <a
                  href={currentAnnouncement.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-yellow-300 hover:text-yellow-200 transition-colors ml-1 md:ml-2 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[10px] md:text-xs underline">{currentAnnouncement.link_text || "Batafsil"}</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 md:ml-1" />
                </a>
              )}
            </div>
            
            {/* Content row - responsive with word break */}
            {currentAnnouncement.content && (
              <p className="text-[11px] md:text-sm text-white/90 mt-1 leading-relaxed break-words">
                {currentAnnouncement.content}
              </p>
            )}
          </div>
        </div>

        {/* Counter and controls */}
        <div className="flex-shrink-0 flex items-center gap-0.5 md:gap-1 pr-1 md:pr-2 z-10">
          {/* Pause/Play button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 md:p-1.5 hover:bg-red-800/50 rounded transition-colors"
            title={isPaused ? "Davom ettirish" : "To'xtatish"}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          </button>

          {/* Counter */}
          {announcements.length > 1 && (
            <span className="text-[10px] md:text-xs bg-red-800/50 px-1.5 md:px-2 py-0.5 md:py-1 rounded">
              {currentIndex + 1}/{announcements.length}
            </span>
          )}
        </div>

        {/* Navigation - Next */}
        {announcements.length > 1 && (
          <button
            onClick={nextAnnouncement}
            className="flex-shrink-0 p-1 md:p-2 hover:bg-red-800/50 transition-colors z-10"
            title="Keyingi"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className="flex-shrink-0 p-1 md:p-2 hover:bg-red-800/50 transition-colors z-10 border-l border-red-500/30"
          title="Yopish"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      {announcements.length > 1 && !isPaused && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-900/50">
          <div 
            className="h-full bg-yellow-400 animate-progress"
            style={{
              animation: 'progress 8s linear infinite',
            }}
          />
        </div>
      )}

      {/* Dots indicator */}
      {announcements.length > 1 && (
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
          {announcements.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIsAnimating(true);
                setTimeout(() => {
                  setCurrentIndex(idx);
                  setIsAnimating(false);
                }, 300);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                idx === currentIndex ? 'bg-yellow-400 w-3' : 'bg-white/40 hover:bg-white/60'
              }`}
              title={`E'lon ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Animation styles */}
      <style jsx>{`
        @keyframes progress {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
