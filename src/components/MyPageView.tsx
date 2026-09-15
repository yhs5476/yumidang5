import React, { useState, useRef } from 'react';
import { User, Heart, Calendar, ShieldCheck, ChevronRight, Settings, Star, Award, LogOut, Sparkles, MessageSquare, Clock, Lock, CreditCard, Camera, Send, Inbox, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Appointment, CurrentUser, ReviewItem, EscrowPayment, JoinRequest } from '../types';

interface MyPageViewProps {
  currentAppointment: Appointment;
  onOpenDashboard: () => void;
  currentUser: CurrentUser | null;
  onOpenAuth: () => void;
  onOpenKyc: () => void;
  onLogout: () => void;
  onUpdateAvatar?: (avatar: string) => void;
  reviews?: ReviewItem[];
  escrowPayments?: EscrowPayment[];
  sentRequests?: JoinRequest[];
  receivedRequests?: JoinRequest[];
  onAcceptRequest?: (requestId: string) => void;
  onRejectRequest?: (requestId: string) => void;
  onExploreMeetups?: () => void;
}

export const MyPageView: React.FC<MyPageViewProps> = ({
  currentAppointment,
  onOpenDashboard,
  currentUser,
  onOpenAuth,
  onOpenKyc,
  onLogout,
  onUpdateAvatar,
  reviews = [],
  escrowPayments = [],
  sentRequests = [],
  receivedRequests = [],
  onAcceptRequest,
  onRejectRequest,
  onExploreMeetups,
}) => {
  const [requestTab, setRequestTab] = useState<'sent' | 'received'>('sent');
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'reviews' | 'escrow'>('info');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateAvatar) {
      if (file.size > 5 * 1024 * 1024) {
        alert('사진 파일 크기는 5MB 이하여야 합니다.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onUpdateAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!currentUser || !currentUser.isLoggedIn) {
    return (
      <div className="px-5 pt-12 pb-24 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#f0edff] text-[#6c2cf5] flex items-center justify-center mx-auto shadow-sm">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">로그인이 필요한 서비스입니다</h3>
        <p className="text-xs text-gray-500 max-w-[280px] mx-auto leading-relaxed">
          유미당은 신뢰할 수 있는 1:1 동행을 위해 간단한 휴대폰 본인확인 후 이용하실 수 있습니다.
        </p>
        <button
          onClick={onOpenAuth}
          className="w-full max-w-xs mx-auto py-3.5 bg-[#6c2cf5] text-white font-bold rounded-xl text-sm shadow-md shadow-purple-500/20 active:scale-98 transition-all"
        >
          휴대폰 본인인증으로 시작하기
        </button>
      </div>
    );
  }

  const diffSugar = Math.round(currentUser.sugarContent - 50);
  const pendingReceivedCount = receivedRequests.filter((r) => r.status === 'pending').length;

  return (
    <div className="px-5 pt-3 pb-24 text-left space-y-4">
      {/* Profile Card */}
      <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_14px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              title="프로필 사진 변경"
            >
              <img
                src={currentUser.avatar}
                alt="내 프로필"
                className="w-14 h-14 rounded-full object-cover shadow-xs group-hover:opacity-90 transition-opacity"
              />
              <span className="absolute bottom-0 right-0 w-5 h-5 bg-[#6c2cf5] rounded-full border-2 border-white flex items-center justify-center text-white shadow-xs group-hover:scale-110 transition-transform">
                <Camera className="w-2.5 h-2.5" />
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-[17px] font-bold text-gray-900">
                  {currentUser.maskedName}
                </h3>
                {currentUser.isKycVerified ? (
                  <span className="text-[10px] font-bold text-[#6c2cf5] bg-[#f0edff] px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3" />
                    공식 KYC 인증
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-[#6c2cf5] bg-[#f0edff] px-2 py-0.5 rounded-full">
                    인증회원
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {currentUser.neighborhood} • {currentUser.ageGroup}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="로그아웃"
            className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Sugar Content (당도) */}
        <div className="mt-4 pt-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-gray-700">당도</span>
            <span className="font-bold text-[#6c2cf5]">{Math.round(currentUser.sugarContent)} 🍯</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#6c2cf5] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(currentUser.sugarContent, 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            {diffSugar >= 0
              ? `기본 당도 50에서 ${diffSugar} 올랐어요!`
              : `기본 당도 50에서 ${Math.abs(diffSugar)} 변동되었어요.`}
          </p>
        </div>
      </div>

      {/* 1:1 동행 신청 관리: 상단 두 탭 (신청한 건 / 신청 받은 건) */}
      <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_14px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setRequestTab('sent')}
              className={`pb-1 text-sm font-bold transition-all relative flex items-center gap-1.5 ${
                requestTab === 'sent'
                  ? 'text-[#6c2cf5] border-b-2 border-[#6c2cf5]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>동행 신청한 건</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                requestTab === 'sent' ? 'bg-[#f0edff] text-[#6c2cf5]' : 'bg-gray-100 text-gray-500'
              }`}>
                {sentRequests.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setRequestTab('received')}
              className={`pb-1 text-sm font-bold transition-all relative flex items-center gap-1.5 ${
                requestTab === 'received'
                  ? 'text-[#6c2cf5] border-b-2 border-[#6c2cf5]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>동행 신청 받은 건</span>
              {pendingReceivedCount > 0 ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-extrabold bg-[#ff4b4b] text-white animate-pulse">
                  {pendingReceivedCount}
                </span>
              ) : (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                  requestTab === 'received' ? 'bg-[#f0edff] text-[#6c2cf5]' : 'bg-gray-100 text-gray-500'
                }`}>
                  {receivedRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 탭 1: 동행 신청한 건 */}
        {requestTab === 'sent' && (
          <div className="space-y-3 animate-in fade-in">
            {sentRequests.length === 0 ? (
              <div className="py-8 text-center bg-gray-50/80 rounded-2xl space-y-2">
                <p className="text-xs text-gray-500 font-medium">내가 신청한 동행이 아직 없습니다.</p>
                {onExploreMeetups && (
                  <button
                    type="button"
                    onClick={onExploreMeetups}
                    className="px-3 py-1.5 bg-[#6c2cf5] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#5820d8] transition-colors"
                  >
                    관심 동행 찾아보기
                  </button>
                )}
              </div>
            ) : (
              sentRequests.map((req) => (
                <div key={req.id} className="p-4 bg-gray-50/80 hover:bg-gray-50 rounded-2xl space-y-2 border border-gray-100/80 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-gray-900 line-clamp-1">
                      {req.postTitle}
                    </h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      req.status === 'accepted'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : req.status === 'rejected'
                        ? 'bg-gray-200 text-gray-600'
                        : 'bg-[#f0edff] text-[#6c2cf5] border border-purple-200'
                    }`}>
                      {req.status === 'accepted'
                        ? '매칭 확정 🎉'
                        : req.status === 'rejected'
                        ? '마감/거절'
                        : '호스트 수락 대기중 ⏳'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl text-xs text-gray-600 space-y-1 shadow-2xs">
                    <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                      <MessageSquare className="w-3 h-3 text-purple-400" />
                      <span>내가 남긴 소개 메시지</span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed font-normal">
                      "{req.message}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      신청 {req.createdAt}
                    </span>
                    {req.status === 'accepted' && (
                      <span className="text-[11px] font-bold text-emerald-600">
                        2/2인 매칭 완료 • 약속 카드 활성화됨
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 탭 2: 동행 신청 받은 건 */}
        {requestTab === 'received' && (
          <div className="space-y-3 animate-in fade-in">
            {receivedRequests.length === 0 ? (
              <div className="py-8 text-center bg-gray-50/80 rounded-2xl">
                <p className="text-xs text-gray-500 font-medium">받은 동행 신청이 없습니다.</p>
                <p className="text-[11px] text-gray-400 mt-0.5">새 동행 공고를 올리고 파트너를 모집해보세요!</p>
              </div>
            ) : (
              receivedRequests.map((req) => (
                <div key={req.id} className="p-4 bg-gray-50/80 rounded-2xl space-y-2.5 border border-gray-100/80 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-100 line-clamp-1 max-w-[200px]">
                      {req.postTitle}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {req.createdAt}
                    </span>
                  </div>

                  {/* 신청자 프로필 정보 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={req.requesterAvatar}
                        alt={req.requesterName}
                        className="w-10 h-10 rounded-full object-cover shadow-2xs"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-900">{req.requesterName}</span>
                          <span className="text-[10px] font-bold text-[#6c2cf5] bg-[#f0edff] px-1.5 py-0.2 rounded">
                            인증
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-[#6c2cf5]">
                          당도 {req.requesterSugar} 🍯
                        </span>
                      </div>
                    </div>

                    {req.status === 'accepted' ? (
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        수락 확정됨
                      </span>
                    ) : req.status === 'rejected' ? (
                      <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
                        거절 완료
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onAcceptRequest?.(req.id)}
                          className="px-3 py-1.5 bg-[#6c2cf5] hover:bg-[#5820d8] text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                        >
                          수락
                        </button>
                        <button
                          type="button"
                          onClick={() => onRejectRequest?.(req.id)}
                          className="px-2.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          거절
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 신청자 메시지 */}
                  <div className="p-2.5 bg-white rounded-xl text-xs text-gray-700 leading-relaxed shadow-2xs font-normal">
                    "{req.message}"
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Quick Stats with interactive Tab switching */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <button
          type="button"
          onClick={() => setActiveSubTab('info')}
          className={`p-3.5 rounded-[20px] transition-all text-center ${
            activeSubTab === 'info'
              ? 'bg-[#f0edff] shadow-sm ring-1.5 ring-[#6c2cf5]'
              : 'bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:bg-gray-50'
          }`}
        >
          <div className="text-[18px] font-bold text-[#6c2cf5]">14회</div>
          <div className="text-xs text-gray-500 mt-0.5 font-medium">참여한 동행</div>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('reviews')}
          className={`p-3.5 rounded-[20px] transition-all text-center ${
            activeSubTab === 'reviews'
              ? 'bg-[#f0edff] shadow-sm ring-1.5 ring-[#6c2cf5]'
              : 'bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:bg-gray-50'
          }`}
        >
          <div className="text-[18px] font-bold text-amber-500">5.0</div>
          <div className="text-xs text-gray-500 mt-0.5 font-medium">동행 평점</div>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('reviews')}
          className={`p-3.5 rounded-[20px] transition-all text-center ${
            activeSubTab === 'reviews'
              ? 'bg-[#f0edff] shadow-sm ring-1.5 ring-[#6c2cf5]'
              : 'bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:bg-gray-50'
          }`}
        >
          <div className="text-[18px] font-bold text-rose-500">{reviews.length > 0 ? reviews.length : 3}개</div>
          <div className="text-xs text-gray-500 mt-0.5 font-medium">받은 후기</div>
        </button>
      </div>

      {/* Subtab Toggle Buttons */}
      <div className="flex bg-gray-100 p-1 rounded-2xl text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('info')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeSubTab === 'info'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          동행 정보
        </button>
        <button
          onClick={() => setActiveSubTab('reviews')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
            activeSubTab === 'reviews'
              ? 'bg-white text-[#6c2cf5] shadow-xs'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <span>칭찬 & 후기</span>
          <Sparkles className="w-3.5 h-3.5 text-[#6c2cf5]" />
        </button>
        <button
          onClick={() => setActiveSubTab('escrow')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
            activeSubTab === 'escrow'
              ? 'bg-white text-purple-700 shadow-xs'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <span>에스크로</span>
          <span className="text-[10px]">💎</span>
        </button>
      </div>

      {/* View 1: Default Info & Menus */}
      {activeSubTab === 'info' && (
        <div className="space-y-4">
          {/* Upcoming Active Appointment */}
          <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_14px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#6c2cf5] bg-[#f0edff] px-2.5 py-0.5 rounded-full">
                진행 예정 동행 (1건)
              </span>
              <button
                onClick={onOpenDashboard}
                className="text-xs font-bold text-[#6c2cf5] hover:underline flex items-center"
              >
                상세보기 &gt;
              </button>
            </div>
            <h4 className="font-bold text-[15px] text-gray-900 leading-snug">
              {currentAppointment.title}
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              {currentAppointment.dateTime} • {currentAppointment.location}
            </p>
          </div>

          {/* Menu List */}
          <div className="bg-white rounded-[24px] overflow-hidden shadow-[0_2px_14px_rgba(0,0,0,0.03)] divide-y divide-gray-50">
            <button
              onClick={onOpenKyc}
              className="w-full p-4 flex items-center justify-between text-xs font-semibold text-gray-800 hover:bg-gray-50 text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#6c2cf5]" />
                <div>
                  <span className="block">선택형 KYC 본인확인 센터</span>
                  <span className="text-[11px] text-gray-400 font-normal">
                    {currentUser.isKycVerified ? '공식 인증 완료' : 'NICE/KCB 모바일 신분증 인증'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {currentUser.isKycVerified && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    인증됨
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </button>

            <button className="w-full p-4 flex items-center justify-between text-xs font-semibold text-gray-800 hover:bg-gray-50 text-left">
              <div className="flex items-center gap-2.5">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>관심 등록한 동행 이벤트</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            <button
              onClick={() => setActiveSubTab('reviews')}
              className="w-full p-4 flex items-center justify-between text-xs font-semibold text-gray-800 hover:bg-gray-50 text-left"
            >
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>취향 키워드 및 동행 뱃지</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* View 2: Phase 5 Reviews & Badges */}
      {activeSubTab === 'reviews' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Praise Badges Collection Card */}
          <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_14px_rgba(0,0,0,0.03)] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>이웃들이 선물한 칭찬 뱃지</span>
              </h4>
              <span className="text-[11px] font-bold text-[#6c2cf5] bg-[#f0edff] px-2 py-0.5 rounded-full">
                총 12회 획득
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-[#f8f9fc] rounded-2xl flex items-center gap-2.5">
                <span className="text-xl">⏰</span>
                <div>
                  <span className="font-bold text-xs text-gray-900 block">시간 약속 마스터</span>
                  <span className="text-[10.5px] text-gray-400">5회 획득</span>
                </div>
              </div>

              <div className="p-3 bg-[#f8f9fc] rounded-2xl flex items-center gap-2.5">
                <span className="text-xl">😊</span>
                <div>
                  <span className="font-bold text-xs text-gray-900 block">친절하고 편안해요</span>
                  <span className="text-[10.5px] text-gray-400">4회 획득</span>
                </div>
              </div>

              <div className="p-3 bg-[#f8f9fc] rounded-2xl flex items-center gap-2.5">
                <span className="text-xl">💬</span>
                <div>
                  <span className="font-bold text-xs text-gray-900 block">대화가 즐거워요</span>
                  <span className="text-[10.5px] text-gray-400">3회 획득</span>
                </div>
              </div>

              <div className="p-3 bg-[#f8f9fc] rounded-2xl flex items-center gap-2.5">
                <span className="text-xl">🤝</span>
                <div>
                  <span className="font-bold text-xs text-gray-900 block">또 만나고 싶어요</span>
                  <span className="text-[10.5px] text-gray-400">2회 획득</span>
                </div>
              </div>
            </div>
          </div>

          {/* Blind Unlocked Reviews List */}
          <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_14px_rgba(0,0,0,0.03)] space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-[#6c2cf5]" />
                <span>블라인드 해제된 동행 후기</span>
              </h4>
              <span className="text-xs text-gray-400">상호 공개 완료</span>
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-[#f8f9fc] rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={rev.reviewerAvatar}
                          alt={rev.reviewerName}
                          className="w-7 h-7 rounded-full object-cover shadow-2xs"
                        />
                        <span className="font-bold text-gray-900">{rev.reviewerName}</span>
                        <span className="text-gray-400 text-[11px]">• {rev.createdAt}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-500 font-bold bg-white px-2 py-0.5 rounded-md shadow-2xs">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{rev.rating}.0</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {rev.badges.map((b, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-bold text-[#6c2cf5] bg-[#f0edff] px-2 py-0.5 rounded-lg"
                        >
                          {b}
                        </span>
                      ))}
                    </div>

                    <p className="text-gray-700 leading-relaxed font-medium">
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Default Sample Reviews */}
                <div className="p-4 bg-[#f8f9fc] rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120"
                        alt="파트너"
                        className="w-7 h-7 rounded-full object-cover shadow-2xs"
                      />
                      <span className="font-bold text-gray-900">이*진</span>
                      <span className="text-gray-400 text-[11px]">• 3일 전</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-500 font-bold bg-white px-2 py-0.5 rounded-md shadow-2xs">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>5.0</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[10px] font-bold text-[#6c2cf5] bg-[#f0edff] px-2 py-0.5 rounded-lg">
                      ⏰ 시간 약속 마스터
                    </span>
                    <span className="text-[10px] font-bold text-[#6c2cf5] bg-[#f0edff] px-2 py-0.5 rounded-lg">
                      💬 대화가 즐거워요
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed font-medium">
                    "처음 해보는 1:1 디저트 투어였는데 너무 친절하게 대해주셔서 어색함 전혀 없이 즐겁게 다녀왔습니다!"
                  </p>
                </div>

                <div className="p-4 bg-[#f8f9fc] rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120"
                        alt="파트너"
                        className="w-7 h-7 rounded-full object-cover shadow-2xs"
                      />
                      <span className="font-bold text-gray-900">박*민</span>
                      <span className="text-gray-400 text-[11px]">• 1주일 전</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-500 font-bold bg-white px-2 py-0.5 rounded-md shadow-2xs">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>5.0</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[10px] font-bold text-[#6c2cf5] bg-[#f0edff] px-2 py-0.5 rounded-lg">
                      😊 친절하고 편안해요
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed font-medium">
                    "매너가 정말 좋으세요. 시간 약속도 칼같이 지켜주셔서 덕분에 기분 좋은 하루였습니다."
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View 3: Escrow & Pro Partner Management (Phase 6) */}
      {activeSubTab === 'escrow' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Escrow Balance & Safety Card */}
          <div className="bg-gradient-to-br from-purple-700 to-indigo-700 text-white rounded-[24px] p-5 shadow-lg shadow-purple-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-bold text-purple-100">안심 에스크로 안전 예치</span>
              </div>
              <span className="text-[11px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full">
                100% 안전 보증
              </span>
            </div>

            <div className="mt-4">
              <span className="text-xs text-purple-200">현재 안전 예치 중인 금액</span>
              <div className="text-2xl font-black tracking-tight mt-0.5">
                {escrowPayments.length > 0
                  ? escrowPayments
                      .reduce((acc, p) => (p.status === 'held' ? acc + p.totalAmount : acc), 0)
                      .toLocaleString()
                  : '60,000'}
                원
              </div>
            </div>

            <p className="text-[11px] text-purple-200 mt-2 leading-relaxed">
              * 1:1 동행이 무사히 종료되고 상호 확인을 마치기 전까지 대금이 유미당에 안전하게 예치됩니다.
            </p>
          </div>

          {/* Escrow Transactions List */}
          <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_14px_rgba(0,0,0,0.03)] space-y-3">
            <h4 className="text-sm font-bold text-gray-900 flex items-center justify-between">
              <span>에스크로 결제 & 예치 내역</span>
              <span className="text-xs text-[#6c2cf5] font-semibold">
                {escrowPayments.length > 0 ? `${escrowPayments.length}건` : '1건'}
              </span>
            </h4>

            {escrowPayments.length > 0 ? (
              <div className="space-y-2.5">
                {escrowPayments.map((p) => (
                  <div key={p.id} className="p-3.5 bg-gray-50 rounded-2xl text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 truncate max-w-[200px]">{p.postTitle}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#6c2cf5]">
                        {p.status === 'held' ? '🔒 예치 중' : '정산 완료'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-500 text-[11px]">
                      <span>호스트: {p.hostName} ({p.totalHours}시간)</span>
                      <span className="font-bold text-gray-900 text-xs">
                        {p.totalAmount.toLocaleString()}원
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400">{p.paidAt} • {p.paymentMethod.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 bg-gray-50 rounded-2xl text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">[PRO] 성수동 감성 골목 스냅 촬영 📸</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#6c2cf5]">
                    🔒 예치 중
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-500 text-[11px]">
                  <span>호스트: 박*준 (2시간)</span>
                  <span className="font-bold text-gray-900 text-xs">60,000원</span>
                </div>
                <div className="text-[10px] text-gray-400">결제 완료 • 카카오페이 안심 결제</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
