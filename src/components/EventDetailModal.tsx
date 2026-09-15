import React from 'react';
import { ChevronLeft, Sparkles, MapPin, Calendar, Users, Heart, Share2, Plus } from 'lucide-react';
import { EventBannerItem, MeetupPost } from '../types';

interface EventDetailModalProps {
  event: EventBannerItem | null;
  isOpen: boolean;
  onClose: () => void;
  relatedPosts: MeetupPost[];
  onJoinMeetup: (post: MeetupPost) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose,
  relatedPosts,
  onJoinMeetup,
}) => {
  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-40 bg-[#f8f9fc] flex justify-center animate-in slide-in-from-right duration-250 text-left selection:bg-purple-100">
      {/* Mobile Page Container */}
      <div className="w-full max-w-[440px] h-full bg-[#f8f9fc] flex flex-col relative shadow-2xl overflow-hidden">
        {/* Top App Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1 -ml-1.5 rounded-full text-gray-700 hover:text-gray-900 hover:bg-gray-100 active:scale-95 transition-all"
              aria-label="뒤로가기"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
            </button>
            <h2 className="text-[17px] font-extrabold text-gray-900 tracking-tight truncate max-w-[260px]">
              {event.title}
            </h2>
          </div>

          <button
            onClick={() => alert('이벤트 링크가 클립보드에 복사되었습니다.')}
            className="p-2 text-gray-600 hover:text-[#6c2cf5] hover:bg-gray-50 rounded-full transition-colors"
            title="공유하기"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </header>

        {/* Scrollable Page Body */}
        <div className="flex-1 overflow-y-auto pb-10">
          {/* Banner Hero Image */}
          <div className="relative h-64 w-full overflow-hidden">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Badges */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5">
              <span className="bg-[#ff5d2b] text-white text-xs font-bold px-2.5 py-1 rounded-[8px] shadow-sm">
                {event.badge}
              </span>
              <span className="bg-white/90 backdrop-blur-xs text-gray-900 text-xs font-bold px-2.5 py-1 rounded-[8px]">
                {event.tag}
              </span>
            </div>

            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="flex items-center gap-1 text-[#fde047] text-xs font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>{event.subBadge}</span>
              </div>
              <h3 className="text-[22px] font-extrabold leading-tight drop-shadow-sm">
                {event.title}
              </h3>
            </div>
          </div>

          {/* Event Details Section */}
          <div className="p-4 space-y-3.5">
            {event.isEnded && (
              <div className="bg-gray-200/80 border border-gray-300 text-gray-700 px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-500" />
                <span>이 이벤트는 기간이 종료된 행사입니다. 지난 동행 후기를 확인해보세요.</span>
              </div>
            )}

            <div className="bg-white p-4 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#6c2cf5] shrink-0" />
                <span className="font-bold text-gray-900">{event.period || '2026.9.12(토) 19:20 시작'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#6c2cf5] shrink-0" />
                <span className="font-semibold text-gray-800">{event.location || `${event.tag} 일대`}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-1.5">
              <h4 className="font-bold text-sm text-gray-900">이벤트 소개</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {event.description || event.subtitle || '혼자 보기 아쉬운 축제/전시를 좋은 이웃과 함께 나누세요. 취향에 맞는 다양한 1:1 동행이 모이고 있습니다.'}
              </p>
            </div>

            {/* Current Meetups For This Event */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-3 px-1">
                <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#6c2cf5]" />
                  <span>이 이벤트 관련 1:1 동행 모임</span>
                </h4>
                <span className="text-xs text-[#6c2cf5] font-bold">{relatedPosts.length}개 진행 중</span>
              </div>

              <div className="space-y-3">
                {relatedPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-5 rounded-[24px] bg-white hover:shadow-md transition-all shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-[#ff5d2b] bg-[#ffebee] px-2.5 py-0.5 rounded-full">
                          {post.category}
                        </span>
                        <h5 className="font-bold text-sm text-gray-900 mt-1 leading-snug">
                          {post.title}
                        </h5>
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                          post.currentMembers >= 2
                            ? 'bg-gray-100 text-gray-400'
                            : 'bg-purple-50 text-[#6c2cf5]'
                        }`}
                      >
                        {post.currentMembers >= 2 ? '2/2명 (마감)' : '1/2명 (모집중)'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={post.avatar}
                          alt={post.author}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <span className="font-bold text-gray-800">{post.author}</span>
                        <span className="text-[#6c2cf5] font-semibold text-[11px]">당도 99 🍯</span>
                      </div>

                      <button
                        onClick={() => onJoinMeetup(post)}
                        disabled={post.currentMembers >= 2}
                        className={`px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-xs ${
                          post.currentMembers >= 2
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-[#6c2cf5] text-white hover:bg-[#5820d8] active:scale-95'
                        }`}
                      >
                        {post.currentMembers >= 2 ? '마감됨' : '동행 신청하기'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
