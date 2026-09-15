import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  Sparkles,
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  Bot,
  Layers,
} from 'lucide-react';
import { EventBannerItem } from '../types';

interface EventAllViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: EventBannerItem[];
  onSelectEvent: (event: EventBannerItem) => void;
  currentWeek?: number;
}

export const EventAllViewModal: React.FC<EventAllViewModalProps> = ({
  isOpen,
  onClose,
  events,
  onSelectEvent,
  currentWeek = 2,
}) => {
  // 주차 필터: null(전체) 또는 1, 2, 3, 4
  const [selectedWeek, setSelectedWeek] = useState<number | null>(currentWeek);
  // 카테고리 필터: 'all' 또는 '팝업', '전시', '축제', '공연'
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // 주차 및 카테고리에 따른 이벤트 필터링
  const filteredEvents = events.filter((event) => {
    // 1. 주차 필터: 사용자가 특정 주차를 선택했을 때
    if (selectedWeek !== null) {
      const eventStartWeek = event.startWeek ?? event.week ?? 2;
      if (eventStartWeek !== selectedWeek) {
        return false;
      }
    }

    // 2. 카테고리 필터
    if (selectedCategory !== 'all') {
      if (event.category !== selectedCategory && !event.badge.includes(selectedCategory)) {
        return false;
      }
    }

    return true;
  });

  // 스크롤 시 하단 바(Bar) 인디케이터 진행도 업데이트
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) {
      setScrollProgress(0);
    } else {
      setScrollProgress(Math.min(100, Math.max(0, (scrollLeft / maxScroll) * 100)));
    }
  };

  useEffect(() => {
    // 필터 변경 시 스크롤 맨 앞으로 리셋
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
      setScrollProgress(0);
    }
  }, [selectedWeek, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#f8f9fc] flex justify-center animate-in slide-in-from-right duration-250 text-left selection:bg-purple-100">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-[440px] h-full bg-[#f8f9fc] flex flex-col relative shadow-2xl overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              id="btn-close-event-all"
              className="p-1 -ml-1.5 rounded-full text-gray-700 hover:text-gray-900 hover:bg-gray-100 active:scale-95 transition-all"
              aria-label="뒤로가기"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
            </button>
            <div>
              <h2 className="text-[17px] font-extrabold text-gray-900 tracking-tight">
                문화 & 팝업 이벤트 전체보기
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-[#f0edff] text-[#6c2cf5] px-2 py-0.5 rounded-full text-[11px] font-bold">
            <Bot className="w-3.5 h-3.5" />
            <span>AI 자동수집</span>
          </div>
        </header>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto pb-10">
          {/* AI Curation Info Banner */}
          <section className="px-5 pt-4 pb-2">
            <div className="bg-gradient-to-r from-[#6c2cf5]/10 via-[#8b5cf6]/10 to-[#ff5d2b]/10 p-3.5 rounded-2xl border border-[#6c2cf5]/15 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#6c2cf5] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <Sparkles className="w-4 h-4 fill-white" />
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-gray-900">
                  9월 주차별 주요 행사 AI 자동 크롤링
                </h4>
                <p className="text-[11.5px] text-gray-600 mt-0.5 leading-relaxed">
                  서울 주요 핫플레이스의 <strong>팝업스토어, 전시, 축제, 공연</strong> 정보를 AI가 매주 크롤링하여 주차별로 큐레이션합니다.
                </p>
              </div>
            </div>
          </section>

          {/* Week Filters (1주차, 2주차, 3주차, 4주차, 전체) */}
          <section className="px-5 pt-3 pb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-bold text-gray-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#6c2cf5]" />
                주차별 필터
              </span>
              <span className="text-[11px] text-[#6c2cf5] font-semibold">
                현재: 9월 {currentWeek}주차 진행중
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
              <button
                id="filter-week-all"
                onClick={() => setSelectedWeek(null)}
                className={`px-3 py-1.5 rounded-full text-[12.5px] font-bold shrink-0 transition-all ${
                  selectedWeek === null
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                전체
              </button>

              {[1, 2, 3, 4].map((wk) => {
                const isSelected = selectedWeek === wk;
                const isCurrent = wk === currentWeek;
                const isPast = wk < currentWeek;

                return (
                  <button
                    key={wk}
                    id={`filter-week-${wk}`}
                    onClick={() => setSelectedWeek(wk)}
                    className={`px-3 py-1.5 rounded-full text-[12.5px] font-bold shrink-0 flex items-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-[#6c2cf5] text-white shadow-sm shadow-[#6c2cf5]/30'
                        : isCurrent
                        ? 'bg-[#f0edff] text-[#6c2cf5] border border-[#6c2cf5]/30 hover:bg-[#e9e4ff]'
                        : isPast
                        ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span>{wk}주차</span>
                    {isCurrent && (
                      <span className="text-[9.5px] bg-[#6c2cf5] text-white px-1.5 py-0.2 rounded-full font-bold">
                        이번주
                      </span>
                    )}
                    {isPast && (
                      <span className="text-[9.5px] bg-gray-300 text-gray-700 px-1 py-0.2 rounded-full">
                        종료건 포함
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Category Filter Pills */}
          <section className="px-5 py-1">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {[
                { id: 'all', label: '전체 행사' },
                { id: '팝업', label: '🛍️ 팝업' },
                { id: '전시', label: '🎨 전시' },
                { id: '축제', label: '🎆 축제' },
                { id: '공연', label: '🎷 공연' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11.5px] font-semibold shrink-0 transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-gray-800 text-white'
                      : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </section>

          {/* Horizontal Event Cards List (요구사항: 이벤트 배너 가로 리스트 뷰) */}
          <section className="pt-3 pb-2">
            <div className="px-5 flex items-center justify-between mb-2">
              <h3 className="text-[14px] font-bold text-gray-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#6c2cf5]" />
                {selectedWeek ? `9월 ${selectedWeek}주차 이벤트` : '전체 이벤트 목록'}
                <span className="text-xs font-semibold text-[#6c2cf5]">({filteredEvents.length})</span>
              </h3>
              <span className="text-[11px] text-gray-400">가로로 넘겨보세요</span>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="mx-5 my-8 p-8 bg-white rounded-2xl text-center border border-dashed border-gray-200">
                <p className="text-sm font-bold text-gray-600">해당 조건의 이벤트가 없습니다.</p>
                <p className="text-xs text-gray-400 mt-1">다른 주차나 카테고리를 선택해보세요.</p>
              </div>
            ) : (
              <div>
                {/* Horizontal Scrollable Row */}
                <div
                  ref={scrollRef}
                  onScroll={handleScroll}
                  className="flex items-stretch gap-3.5 px-5 overflow-x-auto scrollbar-none snap-x snap-mandatory py-1"
                >
                  {filteredEvents.map((event) => {
                    const isEnded = event.isEnded;
                    const eventStartWeek = event.startWeek ?? event.week ?? 2;

                    return (
                      <div
                        key={event.id}
                        id={`event-card-${event.id}`}
                        onClick={() => {
                          onClose();
                          onSelectEvent(event);
                        }}
                        className={`snap-start relative flex-shrink-0 cursor-pointer rounded-[22px] overflow-hidden transition-all duration-300 w-[290px] group shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(108,44,245,0.12)] flex flex-col justify-between ${
                          isEnded
                            ? 'bg-gray-100 border border-gray-300/80 filter grayscale-[80%]'
                            : 'bg-white border border-gray-100'
                        }`}
                        style={{ height: '340px' }}
                      >
                        {/* Image Box */}
                        <div className="relative h-[175px] w-full overflow-hidden shrink-0">
                          <img
                            src={event.imageUrl}
                            alt={event.title}
                            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                              isEnded ? 'opacity-60' : ''
                            }`}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

                          {/* Top Badges */}
                          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                            <div className="flex items-center gap-1.5">
                              {/* Category Badge */}
                              <span
                                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-[7px] shadow-xs ${
                                  isEnded
                                    ? 'bg-gray-600 text-gray-200'
                                    : 'bg-[#ff5d2b] text-white'
                                }`}
                              >
                                {event.category || event.badge}
                              </span>

                              {/* Week Badge */}
                              <span className="bg-black/60 backdrop-blur-xs text-white text-[10.5px] font-medium px-2 py-0.5 rounded-[7px]">
                                9월 {eventStartWeek}주차 시작
                              </span>
                            </div>

                            {/* Status: Ended or Active */}
                            {isEnded ? (
                              <span className="bg-gray-800/90 text-gray-200 text-[10.5px] font-bold px-2 py-0.5 rounded-[7px] border border-white/20">
                                종료됨
                              </span>
                            ) : eventStartWeek === currentWeek ? (
                              <span className="bg-[#22c55e] text-white text-[10.5px] font-bold px-2 py-0.5 rounded-[7px] shadow-xs animate-pulse">
                                진행중
                              </span>
                            ) : eventStartWeek > currentWeek ? (
                              <span className="bg-[#6c2cf5] text-white text-[10.5px] font-bold px-2 py-0.5 rounded-[7px]">
                                오픈예정
                              </span>
                            ) : null}
                          </div>

                          {/* Image Bottom Highlight */}
                          <div className="absolute bottom-2.5 left-3 right-3 text-white">
                            <div className="flex items-center gap-1 text-[#fde047] text-[11px] font-bold">
                              <Sparkles className="w-3 h-3 fill-current" />
                              <span>{event.subBadge}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Text Content */}
                        <div className="p-3.5 flex-1 flex flex-col justify-between">
                          <div>
                            <h4
                              className={`text-[15px] font-bold leading-snug line-clamp-2 ${
                                isEnded ? 'text-gray-500 line-through decoration-gray-400' : 'text-gray-900'
                              }`}
                            >
                              {event.title}
                            </h4>

                            <p className="text-[12px] text-gray-500 mt-1 line-clamp-1">
                              {event.subtitle}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-gray-100 space-y-1 text-[11.5px] text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-[#6c2cf5] shrink-0" />
                              <span className="font-semibold text-gray-700 truncate">
                                {event.period || '기간 상세 확인'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="truncate">{event.location || event.tag}</span>
                            </div>
                          </div>

                          {/* Bottom Action Hint */}
                          <div className="pt-2 flex items-center justify-between text-[11.5px] font-bold">
                            <span className={isEnded ? 'text-gray-400' : 'text-[#6c2cf5]'}>
                              {isEnded ? '지난 행사 상세보기' : '동행 참여 & 상세정보'}
                            </span>
                            <ChevronRight
                              className={`w-4 h-4 transform group-hover:translate-x-1 transition-transform ${
                                isEnded ? 'text-gray-400' : 'text-[#6c2cf5]'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 요구사항: 밑에 하단 바, 이벤트 배너에 맞게 적용, 버튼이 아니라 바 형식 */}
                <div className="px-5 mt-3">
                  <div className="w-full bg-gray-200 h-[5px] rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-[#6c2cf5] rounded-full transition-all duration-150"
                      style={{
                        width: `${Math.max(
                          18,
                          Math.min(100, (1 / Math.max(1, filteredEvents.length)) * 100 + scrollProgress * 0.8)
                        )}%`,
                        marginLeft: `${(scrollProgress * (100 - Math.max(18, (1 / Math.max(1, filteredEvents.length)) * 100))) / 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Detailed Vertical List Section for Quick Browsing */}
          <section className="px-5 pt-5">
            <h3 className="text-[14px] font-bold text-gray-900 mb-2.5">
              전체 일정 리스트
            </h3>

            <div className="space-y-2.5">
              {filteredEvents.map((event) => {
                const isEnded = event.isEnded;
                return (
                  <div
                    key={`list-${event.id}`}
                    onClick={() => {
                      onClose();
                      onSelectEvent(event);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isEnded
                        ? 'bg-gray-50 border-gray-200 opacity-60 filter grayscale'
                        : 'bg-white border-gray-100 hover:border-purple-200 hover:shadow-xs'
                    }`}
                  >
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold bg-[#f0edff] text-[#6c2cf5] px-2 py-0.5 rounded-md">
                          {event.category || event.badge}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">
                          {event.period}
                        </span>
                        {isEnded && (
                          <span className="text-[10px] bg-gray-200 text-gray-600 font-bold px-1.5 py-0.2 rounded">
                            종료
                          </span>
                        )}
                      </div>
                      <h5 className="text-[13px] font-bold text-gray-900 truncate">
                        {event.title}
                      </h5>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {event.location || event.tag}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
