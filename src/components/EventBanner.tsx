import React, { useState, useRef } from 'react';
import { ChevronRight, Sparkles, Bot } from 'lucide-react';
import { EventBannerItem } from '../types';

interface EventBannerProps {
  events: EventBannerItem[];
  onSelectEvent: (event: EventBannerItem) => void;
  onViewAllEvents: () => void;
  currentWeek?: number;
}

export const EventBanner: React.FC<EventBannerProps> = ({
  events,
  onSelectEvent,
  onViewAllEvents,
  currentWeek = 2,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // AI 크롤링 연동 원칙: 해당 주차(9월 2주차)에 시작되는 이벤트만 홈 배너에 자동 표시
  const currentWeekEvents = events.filter(
    (event) => (event.startWeek ?? event.week ?? 2) === currentWeek && !event.isEnded
  );

  const displayEvents = currentWeekEvents.length > 0 ? currentWeekEvents : events.slice(0, 4);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const newIndex = Math.round(scrollLeft / (clientWidth * 0.8));
    if (newIndex >= 0 && newIndex < displayEvents.length && newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  const scrollToSlide = (idx: number) => {
    setCurrentIndex(idx);
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.clientWidth * 0.85;
    scrollRef.current.scrollTo({
      left: idx * cardWidth,
      behavior: 'smooth',
    });
  };

  return (
    <section className="px-5 pt-3 pb-5">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-5 h-5 text-[#8b5cf6] fill-[#8b5cf6]/20" />
          <h2 className="text-[18px] font-bold text-gray-900 tracking-tight">
            9월 {currentWeek}주차 주목할 이벤트
          </h2>
          <span className="bg-[#f0edff] text-[#6c2cf5] text-[10.5px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
            <Bot className="w-3 h-3" />
            AI추천
          </span>
        </div>
        <button
          id="btn-view-all-events"
          onClick={onViewAllEvents}
          className="text-[13.5px] text-gray-500 hover:text-[#6c2cf5] font-semibold flex items-center transition-colors group cursor-pointer"
        >
          <span>전체보기</span>
          <ChevronRight className="w-4 h-4 ml-0.5 text-gray-400 group-hover:text-[#6c2cf5] transform group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>

      {/* Carousel Container with Peek Effect */}
      <div className="relative overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex items-stretch gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory py-0.5"
        >
          {displayEvents.map((event, idx) => {
            const isMain = idx === currentIndex;
            return (
              <div
                key={event.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  onSelectEvent(event);
                }}
                className={`snap-start relative flex-shrink-0 cursor-pointer rounded-[20px] overflow-hidden shadow-sm transition-all duration-300 ${
                  isMain ? 'w-[calc(100%-24px)]' : 'w-[75%]'
                }`}
                style={{ minHeight: '235px' }}
              >
                {/* Background Image */}
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="absolute inset-0 w-full h-full object-cover object-center transform transition-transform duration-700 hover:scale-105"
                />

                {/* Dark Gradient Overlay for optimal legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

                {/* Top Badge: 카테고리 / 행사 형태 */}
                <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5">
                  <span className="inline-block bg-[#ff5d2b] text-white text-[12px] font-bold px-2.5 py-1 rounded-[8px] shadow-sm">
                    {event.badge}
                  </span>
                  <span className="bg-black/50 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded-[7px]">
                    9월 {event.startWeek ?? event.week}주차 시작
                  </span>
                </div>

                {/* Bottom Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4.5 z-10 flex flex-col gap-1.5 text-left">
                  {/* Highlight Recommendation */}
                  <div className="flex items-center gap-1 text-[#fde047] text-[12px] font-semibold tracking-tight">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
                    </svg>
                    <span>{event.subBadge}</span>
                  </div>

                  {/* Main Headline */}
                  <h3 className="text-white text-[18px] font-bold leading-snug drop-shadow-sm">
                    {event.title}
                  </h3>

                  {/* Subtitle */}
                  <p className="text-white/85 text-[13px] font-normal leading-relaxed">
                    {event.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel Indicator Bars */}
        <div className="flex items-center justify-center gap-1.5 mt-3.5">
          {displayEvents.map((_, idx) => (
            <button
              key={idx}
              id={`carousel-dot-${idx}`}
              onClick={() => scrollToSlide(idx)}
              className={`h-[4px] rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-10 bg-[#6c2cf5]'
                  : 'w-10 bg-gray-200 hover:bg-gray-300'
              }`}
              aria-label={`이벤트 슬라이드 ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
