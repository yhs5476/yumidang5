/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { maskRealName } from './utils/maskName';
import { trackBackEvent } from './utils/trackBackEvent';
import { trackFunnelEvent } from './utils/trackFunnelEvent';
import { Header } from './components/Header';
import { EventBanner } from './components/EventBanner';
import { AppointmentCard } from './components/AppointmentCard';
import { CategoryGrid } from './components/CategoryGrid';
import { BottomNav, NavTab } from './components/BottomNav';
import { DashboardModal } from './components/DashboardModal';
import { EventDetailModal } from './components/EventDetailModal';
import { EventAllViewModal } from './components/EventAllViewModal';
import { CategoryDetailModal } from './components/CategoryDetailModal';
import { CreateMeetupModal } from './components/CreateMeetupModal';

import { NotificationModal } from './components/NotificationModal';
import { AuthModal } from './components/AuthModal';
import { KycAuthModal } from './components/KycAuthModal';
import { PostDetailModal } from './components/PostDetailModal';
import { JoinRequestModal } from './components/JoinRequestModal';
import { MatchRequestsModal } from './components/MatchRequestsModal';
import { SafetyRulesModal } from './components/SafetyRulesModal';
import { VoiceCallModal } from './components/VoiceCallModal';
import { ReportModal } from './components/ReportModal';
import { ReviewModal } from './components/ReviewModal';
import { EscrowPaymentModal } from './components/EscrowPaymentModal';
import { ExploreView } from './components/ExploreView';
import { ChatView } from './components/ChatView';
import { MyPageView } from './components/MyPageView';

import {
  mockAppointment,
  mockAppointments,
  mockCategories,
  mockEventBanners,
  mockMeetupPosts,
  mockNotifications,
} from './data/mockData';
import { Appointment, CategoryItem, EventBannerItem, MeetupPost, CurrentUser, JoinRequest, ReviewItem, EscrowPayment } from './types';

export default function App() {
  // Navigation state
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // User Auth state (Supabase Auth 연동)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    // 1. 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        const name = meta.realName || '유미당 회원';
        const masked = meta.maskedName || maskRealName(name);
        setCurrentUser({
          id: session.user.id,
          isLoggedIn: true,
          email: session.user.email,
          phone: session.user.phone || '010-0000-0000',
          realName: name,
          maskedName: masked,
          nickname: masked,
          gender: meta.gender || 'female',
          ageGroup: meta.ageGroup || '20대',
          neighborhood: meta.neighborhood || '서울 강남구 역삼동',
          sugarContent: 50,
          isPhoneVerified: false,
          isKycVerified: false,
          avatar: meta.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          bio: meta.bio || '유미당과 함께하는 따뜻한 동행입니다.',
          joinedAt: '2026.09',
        });
      }
    });

    // 2. Auth 상태 변화 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        const name = meta.realName || '유미당 회원';
        const masked = meta.maskedName || maskRealName(name);
        setCurrentUser({
          id: session.user.id,
          isLoggedIn: true,
          email: session.user.email,
          phone: session.user.phone || '010-0000-0000',
          realName: name,
          maskedName: masked,
          nickname: masked,
          gender: meta.gender || 'female',
          ageGroup: meta.ageGroup || '20대',
          neighborhood: meta.neighborhood || '서울 강남구 역삼동',
          sugarContent: 50,
          isPhoneVerified: false,
          isKycVerified: false,
          avatar: meta.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          bio: meta.bio || '유미당과 함께하는 따뜻한 동행입니다.',
          joinedAt: '2026.09',
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Modal states
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventBannerItem | null>(null);
  const [isEventAllModalOpen, setIsEventAllModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);

  // Phase 2: Post Detail & Editing states
  const [selectedPostForDetail, setSelectedPostForDetail] = useState<MeetupPost | null>(null);
  const [editingPost, setEditingPost] = useState<MeetupPost | null>(null);

  // Phase 3: 1:1 Matching Requests & Modals
  const [isJoinRequestModalOpen, setIsJoinRequestModalOpen] = useState(false);
  const [selectedPostForJoin, setSelectedPostForJoin] = useState<MeetupPost | null>(null);
  const [isMatchRequestsOpen, setIsMatchRequestsOpen] = useState(false);

  // Phase 4: Safety, Voice Call & Emergency Report states
  const [isSafetyRulesOpen, setIsSafetyRulesOpen] = useState(false);
  const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Phase 5: Mutual Blind Review & Sugar Settling states
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // UI 뒤로가기/닫기 이벤트 및 체류시간 실시간 추적 (Supabase 정규화 테이블 ui_back_events)
  const modalOpenTimes = useRef<Record<string, number>>({});

  useEffect(() => {
    if (selectedPostForDetail) {
      modalOpenTimes.current['POST_DETAIL'] = Date.now();
      trackFunnelEvent({
        step: 'POST_DETAIL_VIEW',
        targetPostId: selectedPostForDetail.id,
        pageKey: 'POST_DETAIL',
      });
    } else if (modalOpenTimes.current['POST_DETAIL']) {
      const durationMs = Date.now() - modalOpenTimes.current['POST_DETAIL'];
      delete modalOpenTimes.current['POST_DETAIL'];
      trackBackEvent({ pageKey: 'POST_DETAIL', actionType: 'close', durationMs });
    }
  }, [selectedPostForDetail]);

  useEffect(() => {
    if (selectedCategory) {
      modalOpenTimes.current['CATEGORY_DETAIL'] = Date.now();
    } else if (modalOpenTimes.current['CATEGORY_DETAIL']) {
      const durationMs = Date.now() - modalOpenTimes.current['CATEGORY_DETAIL'];
      delete modalOpenTimes.current['CATEGORY_DETAIL'];
      trackBackEvent({ pageKey: 'CATEGORY_DETAIL', actionType: 'close', durationMs });
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedEvent) {
      modalOpenTimes.current['EVENT_DETAIL'] = Date.now();
    } else if (modalOpenTimes.current['EVENT_DETAIL']) {
      const durationMs = Date.now() - modalOpenTimes.current['EVENT_DETAIL'];
      delete modalOpenTimes.current['EVENT_DETAIL'];
      trackBackEvent({ pageKey: 'EVENT_DETAIL', actionType: 'close', durationMs });
    }
  }, [selectedEvent]);

  useEffect(() => {
    if (isCreateModalOpen) {
      modalOpenTimes.current['CREATE_MEETUP'] = Date.now();
    } else if (modalOpenTimes.current['CREATE_MEETUP']) {
      const durationMs = Date.now() - modalOpenTimes.current['CREATE_MEETUP'];
      delete modalOpenTimes.current['CREATE_MEETUP'];
      trackBackEvent({ pageKey: 'CREATE_MEETUP', actionType: 'close', durationMs });
    }
  }, [isCreateModalOpen]);

  useEffect(() => {
    if (isAuthModalOpen) {
      modalOpenTimes.current['AUTH'] = Date.now();
    } else if (modalOpenTimes.current['AUTH']) {
      const durationMs = Date.now() - modalOpenTimes.current['AUTH'];
      delete modalOpenTimes.current['AUTH'];
      trackBackEvent({ pageKey: 'AUTH', actionType: 'close', durationMs });
    }
  }, [isAuthModalOpen]);

  useEffect(() => {
    if (isDashboardOpen) {
      modalOpenTimes.current['DASHBOARD'] = Date.now();
    } else if (modalOpenTimes.current['DASHBOARD']) {
      const durationMs = Date.now() - modalOpenTimes.current['DASHBOARD'];
      delete modalOpenTimes.current['DASHBOARD'];
      trackBackEvent({ pageKey: 'DASHBOARD', actionType: 'close', durationMs });
    }
  }, [isDashboardOpen]);

  useEffect(() => {
    if (isJoinRequestModalOpen) {
      modalOpenTimes.current['JOIN_REQUEST'] = Date.now();
    } else if (modalOpenTimes.current['JOIN_REQUEST']) {
      const durationMs = Date.now() - modalOpenTimes.current['JOIN_REQUEST'];
      delete modalOpenTimes.current['JOIN_REQUEST'];
      trackBackEvent({ pageKey: 'JOIN_REQUEST', actionType: 'close', durationMs });
    }
  }, [isJoinRequestModalOpen]);

  useEffect(() => {
    if (isMatchRequestsOpen) {
      modalOpenTimes.current['MATCH_REQUESTS'] = Date.now();
    } else if (modalOpenTimes.current['MATCH_REQUESTS']) {
      const durationMs = Date.now() - modalOpenTimes.current['MATCH_REQUESTS'];
      delete modalOpenTimes.current['MATCH_REQUESTS'];
      trackBackEvent({ pageKey: 'MATCH_REQUESTS', actionType: 'close', durationMs });
    }
  }, [isMatchRequestsOpen]);
  const [reviews, setReviews] = useState<ReviewItem[]>([
    {
      id: 'rev-sample-1',
      appointmentId: 'apt-sample-1',
      appointmentTitle: '삼청동 한옥 카페 디저트 투어 1:1 동행',
      reviewerName: '이*진',
      reviewerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120',
      targetName: '나',
      rating: 5,
      badges: ['시간 약속을 칼같이 지켜요', '대화가 편안하고 즐거워요'],
      comment: '처음 해보는 1:1 디저트 투어였는데 너무 친절하게 대해주셔서 어색함 전혀 없이 즐겁게 다녀왔습니다!',
      isBlind: false,
      createdAt: '3일 전',
    },
    {
      id: 'rev-sample-2',
      appointmentId: 'apt-sample-2',
      appointmentTitle: '주말 성수동 서울숲 산책 1:1 동행',
      reviewerName: '박*민',
      reviewerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
      targetName: '나',
      rating: 5,
      badges: ['친절하고 배려심이 넘쳐요', '시간 약속을 칼같이 지켜요'],
      comment: '매너가 정말 좋으세요. 시간 약속도 칼같이 지켜주셔서 덕분에 기분 좋은 하루였습니다.',
      isBlind: false,
      createdAt: '1주일 전',
    },
  ]);

  // Phase 6: Pro Paid Companion & Escrow States
  const [isEscrowModalOpen, setIsEscrowModalOpen] = useState(false);
  const [selectedProPostForEscrow, setSelectedProPostForEscrow] = useState<MeetupPost | null>(null);
  const [escrowPayments, setEscrowPayments] = useState<EscrowPayment[]>([
    {
      id: 'escrow-init-1',
      postId: 'post-6',
      postTitle: '[PRO] 성수동 감성 골목 인생샷 스냅 촬영 1:1 동행 📸',
      hostName: '박*준 (포토그래퍼)',
      requesterName: '조*미',
      hourlyRate: 30000,
      totalHours: 2,
      totalAmount: 60000,
      status: 'held',
      paidAt: '어제',
      paymentMethod: 'kakaopay',
    },
  ]);

  // 내가 받은 1:1 동행 신청들 (호스트 관점)
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([
    {
      id: 'req-init-1',
      postId: 'm4',
      postTitle: '성수동 디저트 오마카세 같이 가실 분',
      requesterId: 'user-req-1',
      requesterName: '김*수',
      requesterAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
      requesterSugar: 78,
      message: '안녕하세요! 디저트 카페 투어 정말 좋아하는데 혼자 가기 아쉬웠어요. 약속 시간 잘 지키겠습니다 :)',
      status: 'pending',
      createdAt: '10분 전',
    },
    {
      id: 'req-init-2',
      postId: 'm4',
      postTitle: '성수동 디저트 오마카세 같이 가실 분',
      requesterId: 'user-req-2',
      requesterName: '이*은',
      requesterAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
      requesterSugar: 85,
      message: '성수동 거주 중인 30대입니다. 매너 있게 좋은 대화 나누며 달콤한 시간 보내요!',
      status: 'pending',
      createdAt: '30분 전',
    },
  ]);

  // 내가 신청한 1:1 동행들 (게스트 관점)
  const [sentRequests, setSentRequests] = useState<JoinRequest[]>([
    {
      id: 'req-sent-1',
      postId: 'post-1',
      postTitle: '불꽃축제 원효대교 북단 돗자리 명당 1:1 동행 구해요!',
      requesterId: 'user-default',
      requesterName: '조*미',
      requesterAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      requesterSugar: 50,
      message: '불꽃축제 사진 찍는 거 좋아해요! 따뜻한 음료 챙겨서 갈게요 :)',
      status: 'pending',
      createdAt: '1시간 전',
    },
    {
      id: 'req-sent-2',
      postId: 'post-3',
      postTitle: '국립현대미술관 동시대 미술 도슨트 투어 동행',
      requesterId: 'user-default',
      requesterName: '조*미',
      requesterAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      requesterSugar: 50,
      message: '미술 전시 관람 좋아해서 도슨트 투어 같이 듣고 삼청동 카페 가요!',
      status: 'accepted',
      createdAt: '어제',
    },
  ]);

  // App data states
  const [appointment, setAppointment] = useState<Appointment>(mockAppointment);
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [meetupPosts, setMeetupPosts] = useState<MeetupPost[]>(() =>
    mockMeetupPosts.map((p) => ({
      ...p,
      maxMembers: 2,
      currentMembers: p.status === 'closed' ? 2 : 1,
    }))
  );
  const [notifications, setNotifications] = useState(mockNotifications);

  // 1대1 동행 서비스 원칙(최대 2명) 강제 정규화
  const activeMeetupPosts = meetupPosts.map((p) => ({
    ...p,
    maxMembers: 2,
    currentMembers: p.status === 'closed' ? 2 : Math.min(p.currentMembers, 1),
  }));

  const unreadNotifCount = notifications.filter((n) => !n.read).length;
  const pendingRequestsCount = joinRequests.filter((r) => r.status === 'pending').length;

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleOpenCreateMeetup = () => {
    if (!currentUser || !currentUser.isLoggedIn) {
      setIsAuthModalOpen(true);
      return;
    }
    setEditingPost(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateMeetup = (newPost: MeetupPost) => {
    setMeetupPosts((prev) => [newPost, ...prev]);
    trackFunnelEvent({
      step: 'CREATE_MEETUP_SUBMIT',
      targetPostId: newPost.id,
      pageKey: 'CREATE_MEETUP',
      metadata: { category: newPost.category, title: newPost.title },
    });
    // Also add notification
    setNotifications((prev) => [
      {
        id: 'notif-' + Date.now(),
        title: '새로운 1:1 동행이 등록되었습니다',
        description: `[${newPost.category}] "${newPost.title}" 모집이 시작되었습니다.`,
        time: '방금',
        read: false,
        type: 'event',
      },
      ...prev,
    ]);
  };

  const handleUpdatePost = (updatedPost: MeetupPost) => {
    setMeetupPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
    setSelectedPostForDetail(updatedPost);
    setEditingPost(null);
    setNotifications((prev) => [
      {
        id: 'notif-' + Date.now(),
        title: '동행 공고가 수정되었습니다',
        description: `"${updatedPost.title}" 내용이 성공적으로 갱신되었습니다.`,
        time: '방금',
        read: false,
        type: 'event',
      },
      ...prev,
    ]);
  };

  const handleClosePost = (postId: string) => {
    setMeetupPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status: 'closed', currentMembers: 2 } : p))
    );
    setSelectedPostForDetail((prev) =>
      prev && prev.id === postId ? { ...prev, status: 'closed', currentMembers: 2 } : prev
    );
    setNotifications((prev) => [
      {
        id: 'notif-' + Date.now(),
        title: '동행 모집이 조기 마감되었습니다',
        description: '공고가 2/2명 마감 상태로 전환되었습니다.',
        time: '방금',
        read: false,
        type: 'matching',
      },
      ...prev,
    ]);
  };

  const handleDeletePost = (postId: string) => {
    setMeetupPosts((prev) => prev.filter((p) => p.id !== postId));
    setSelectedPostForDetail(null);
    setNotifications((prev) => [
      {
        id: 'notif-' + Date.now(),
        title: '동행 공고가 삭제되었습니다',
        description: '등록하셨던 공고가 정상적으로 삭제 처리되었습니다.',
        time: '방금',
        read: false,
        type: 'event',
      },
      ...prev,
    ]);
  };

  const handleEditPost = (post: MeetupPost) => {
    setEditingPost(post);
    setSelectedPostForDetail(null);
    setIsCreateModalOpen(true);
  };

  // Phase 3: Initiate 1:1 Join Request Modal
  const handleStartJoinRequest = (post: MeetupPost) => {
    if (!currentUser || !currentUser.isLoggedIn) {
      setIsAuthModalOpen(true);
      return;
    }
    if (currentUser.id === post.authorId) {
      alert('본인이 작성한 동행 공고에는 참여 신청할 수 없습니다.');
      return;
    }
    if (post.status === 'closed' || post.currentMembers >= 2) {
      alert('이미 1:1 매칭이 마감된(2/2명) 공고입니다.');
      return;
    }

    trackFunnelEvent({
      step: 'JOIN_REQUEST_OPEN',
      targetPostId: post.id,
      pageKey: 'JOIN_REQUEST',
    });

    setSelectedPostForJoin(post);
    setSelectedPostForDetail(null);
    setSelectedEvent(null);
    setSelectedCategory(null);
    setIsJoinRequestModalOpen(true);
  };

  // Phase 3: Submit Join Request
  const handleSendJoinRequest = (postId: string, message: string) => {
    const post = activeMeetupPosts.find((p) => p.id === postId) || selectedPostForJoin;
    if (!post || !currentUser) return;

    trackFunnelEvent({
      step: 'JOIN_REQUEST_SUBMIT',
      targetPostId: post.id,
      pageKey: 'JOIN_REQUEST',
      metadata: { messageLength: message.length },
    });

    const newReq: JoinRequest = {
      id: 'req-' + Date.now(),
      postId: post.id,
      postTitle: post.title,
      requesterId: currentUser.id,
      requesterName: currentUser.maskedName,
      requesterAvatar: currentUser.avatar,
      requesterSugar: currentUser.sugarContent,
      message,
      status: 'pending',
      createdAt: '방금',
    };

    setSentRequests((prev) => [newReq, ...prev]);
    setJoinRequests((prev) => [newReq, ...prev]);

    setNotifications((prev) => [
      {
        id: 'notif-' + Date.now(),
        title: '1:1 동행 참여 신청 완료',
        description: `"${post.title}" 공고에 소개 메시지와 함께 신청이 접수되었습니다. 호스트가 수락하면 1:1 채팅방이 열립니다.`,
        time: '방금',
        read: false,
        type: 'matching',
      },
      ...prev,
    ]);

    alert(`[신청 완료] "${post.title}" 호스트에게 1:1 동행 신청서가 전달되었습니다!`);
  };

  // Phase 3: Accept Join Request (Single Lock Mechanism)
  const handleAcceptRequest = (requestId: string) => {
    const targetReq = joinRequests.find((r) => r.id === requestId);
    if (!targetReq) return;

    trackFunnelEvent({
      step: 'MATCH_ACCEPT',
      targetPostId: targetReq.postId,
      pageKey: 'MATCH_REQUESTS',
      metadata: { requesterId: targetReq.requesterId },
    });

    // 1. Single Lock: Set chosen request accepted, others for the same post rejected
    setJoinRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return { ...r, status: 'accepted' };
        }
        if (r.postId === targetReq.postId && r.status === 'pending') {
          return { ...r, status: 'rejected' };
        }
        return r;
      })
    );

    // 2. Close post and set members to 2/2
    const targetPost = meetupPosts.find((p) => p.id === targetReq.postId);
    setMeetupPosts((prev) =>
      prev.map((p) =>
        p.id === targetReq.postId ? { ...p, status: 'closed', currentMembers: 2 } : p
      )
    );

    // 3. Update confirmed appointment
    const newAppointment: Appointment = {
      id: 'apt-' + Date.now(),
      title: targetReq.postTitle,
      category: targetPost?.category || '디저트',
      dateTime: targetPost?.time || '2026.9.15(화) 15:00',
      location: targetPost?.location || '성수동 디저트 카페',
      currentMembers: 2,
      maxMembers: 2,
      status: '매칭 확정',
      partnerName: targetReq.requesterName,
      partnerAvatar: targetReq.requesterAvatar,
      partnerRole: '참여자',
      dDay: 'D-2 화 15:00',
      dDayDays: 2,
      appointmentBadge: '약속 D-2',
    };
    setAppointment(newAppointment);
    setAppointments((prev) => [newAppointment, ...prev]);

    // 4. Send system notification
    setNotifications((prev) => [
      {
        id: 'notif-' + Date.now(),
        title: '🎉 1:1 동행 매칭 확정!',
        description: `${targetReq.requesterName}님과의 1:1 동행이 확정(2/2명)되었습니다. 채팅방에서 세부 일정을 조율해보세요!`,
        time: '방금',
        read: false,
        type: 'matching',
      },
      ...prev,
    ]);

    setIsMatchRequestsOpen(false);
    setActiveTab('chat');
  };

  // Phase 3: Reject Join Request
  const handleRejectRequest = (requestId: string) => {
    setJoinRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'rejected' } : r))
    );
  };

  // Phase 3: Real-time Schedule update from ChatView proposal
  const handleUpdateAppointment = (newSchedule: { dateTime: string; location: string }) => {
    setAppointment((prev) => ({
      ...prev,
      dateTime: newSchedule.dateTime,
      location: newSchedule.location,
    }));
    setNotifications((prev) => [
      {
        id: 'notif-' + Date.now(),
        title: '📅 1:1 동행 약속 변경 완료',
        description: `약속이 [${newSchedule.dateTime} / ${newSchedule.location}] (으)로 확정 변경되었습니다.`,
        time: '방금',
        read: false,
        type: 'matching',
      },
      ...prev,
    ]);
  };

  // Phase 4: Handle Emergency / No-Show Report Submit
  const handleReportSubmit = (reasonType: string, details: string) => {
    const reasonMap: Record<string, string> = {
      noshow: '20분 이상 미출현 (노쇼 발생)',
      harassment: '불쾌한 언행 / 비매너 / 성희롱',
      commercial: '금전 요구 / 상업적 영업 / 종교 포교',
      danger: '위급 상황 / 신변 위협 (긴급 SOS)',
    };
    const reasonLabel = reasonMap[reasonType] || reasonType;

    setNotifications((prev) => [
      {
        id: 'notif-' + Date.now(),
        title: `🚨 [신고 접수] ${reasonLabel}`,
        description: `${appointment.partnerName} 회원에 대한 신고가 안전센터에 접수되었습니다. 상대방의 당도 패널티(-20 Brix) 검토 및 운영진 조사가 즉시 시작됩니다.`,
        time: '방금',
        read: false,
        type: 'matching',
      },
      ...prev,
    ]);
  };

  // Phase 4: Send 10-minute Arrival Notice
  const handleSendArrivalNotice = () => {
    setNotifications((prev) => [
      {
        id: 'notif-' + Date.now(),
        title: '🔔 도착 예정 안심 알림 발송',
        description: `${appointment.partnerName}님에게 '약속 장소에 10분 내 도착 예정입니다!' 메시지를 전달했습니다.`,
        time: '방금',
        read: false,
        type: 'chat',
      },
      ...prev,
    ]);
    alert(`${appointment.partnerName}님에게 '약속 장소에 10분 내 도착 예정입니다!' 안심 알림을 전송했습니다.`);
  };

  // Phase 5: Mutual Blind Review Submit & Sugar Settling
  const handleOpenReview = () => {
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = (reviewPayload: { rating: number; badges: string[]; comment: string }) => {
    setNotifications((prev) => [
      {
        id: 'notif-' + Date.now(),
        title: '🔒 블라인드 평가 제출 완료',
        description: `${appointment.partnerName}님과의 동행 평가가 안전하게 잠겼습니다. 상대방이 제출하면 동시 해제됩니다.`,
        time: '방금',
        read: false,
        type: 'matching',
      },
      ...prev,
    ]);
  };

  const handleSettleSugar = (delta: number, partnerReview: ReviewItem) => {
    // 1. 당도 정수형 가산
    setCurrentUser((prev) => {
      if (!prev) return null;
      const nextSugar = Math.min(100, Math.round(prev.sugarContent + delta));
      return {
        ...prev,
        sugarContent: nextSugar,
      };
    });

    // 2. 동행 상태 완료로 전환
    setAppointment((prev) => ({
      ...prev,
      status: '동행 완료',
      dDay: '완료됨',
    }));

    // 3. 후기 리스트에 추가
    setReviews((prev) => [partnerReview, ...prev]);

    // 4. 시스템 알림 발송
    setNotifications((prev) => [
      {
        id: 'notif-' + Date.now(),
        title: `🍯 당도 정산 완료 (+${delta} 🍯 상승!)`,
        description: `양측 블라인드 평가가 동시 해제되었습니다! ${appointment.partnerName}님이 칭찬 뱃지를 선물했습니다.`,
        time: '방금',
        read: false,
        type: 'matching',
      },
      ...prev,
    ]);
  };

  const handleAuthSuccess = (newUser: CurrentUser) => {
    setCurrentUser(newUser);
    setNotifications((prev) => [
      {
        id: 'notif-' + Date.now(),
        title: '휴대폰 본인인증 완료',
        description: `${newUser.maskedName}님, 환영합니다! 신뢰할 수 있는 1:1 동행을 시작하세요.`,
        time: '방금',
        read: false,
        type: 'matching',
      },
      ...prev,
    ]);
  };

  const handleKycSuccess = () => {
    if (currentUser) {
      setCurrentUser((prev) => (prev ? { ...prev, isKycVerified: true } : null));
      setNotifications((prev) => [
        {
          id: 'notif-' + Date.now(),
          title: '공식 KYC 본인확인 완료',
          description: '프로필에 공식 인증 마크가 부여되었습니다.',
          time: '방금',
          read: false,
          type: 'matching',
        },
        ...prev,
      ]);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
    setCurrentUser(null);
  };

  const handleUpdateAvatar = (newAvatar: string) => {
    setCurrentUser((prev) => (prev ? { ...prev, avatar: newAvatar } : null));
  };

  // Phase 6: Pro Escrow Payment Handlers
  const handleOpenEscrow = (post: MeetupPost) => {
    setSelectedPostForDetail(null);
    setSelectedProPostForEscrow(post);
    setIsEscrowModalOpen(true);
  };

  const handleCompleteEscrowPayment = (payment: EscrowPayment, post: MeetupPost) => {
    setEscrowPayments((prev) => [payment, ...prev]);

    // 1:1 매칭 확정 (2/2명 잠금)
    setMeetupPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, currentMembers: 2, status: 'closed' } : p
      )
    );

    // 약속 카드 갱신
    setAppointment({
      id: 'apt-' + Date.now(),
      status: '매칭완료',
      dDay: 'D-2',
      appointmentBadge: 'PRO 1:1 확정',
      title: post.title,
      dateTime: post.time,
      location: post.location,
      partnerName: post.author,
      partnerAvatar: post.avatar,
      partnerRating: 5.0,
      partnerBio: `PRO 전문 동행 호스트 (${post.proDetails?.specialty || '전문 동행'})`,
      menuRecommendation: post.category,
      addressDetail: post.secretLocation || post.location,
      confirmedGuests: 2,
      totalGuests: 2,
      companionType: 'pro',
      proDetails: post.proDetails,
      escrowPayment: payment,
    });

    // 알림 추가
    setNotifications((prev) => [
      {
        id: 'notif-' + Date.now(),
        title: '💎 [PRO] 1:1 안심 에스크로 결제 및 매칭 확정!',
        description: `[${post.author}] 님과의 1:1 동행 (${payment.totalHours}시간)이 확정되었습니다. 결제 금액(${payment.totalAmount.toLocaleString()}원)은 안전하게 예치되었습니다.`,
        time: '방금',
        read: false,
        type: 'matching',
      },
      ...prev,
    ]);
  };

  return (
    <div className="min-h-screen bg-[#f2f4f8] flex justify-center selection:bg-purple-100">
      {/* Mobile container simulating the exact mobile app interface */}
      <main className="w-full max-w-[440px] min-h-screen bg-white shadow-xl relative flex flex-col">
        {/* Top Header */}
        <Header
          unreadCount={unreadNotifCount}
          pendingRequestCount={pendingRequestsCount}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />

        {/* Tab 1: Home View */}
        {activeTab === 'home' && (
          <div className="flex-1 overflow-y-auto pb-6">
            {/* 1. 9월 2주차 주목할 이벤트 */}
            <EventBanner
              events={mockEventBanners}
              onSelectEvent={(event) => setSelectedEvent(event)}
              onViewAllEvents={() => setIsEventAllModalOpen(true)}
              currentWeek={2}
            />

            {/* 2. 매칭 확정 약속 카드 */}
            <AppointmentCard
              appointments={appointments}
              appointment={appointment}
              onOpenDashboard={(selectedAppt) => {
                setAppointment(selectedAppt);
                setIsDashboardOpen(true);
              }}
            />

            {/* 3. 어떤 동행을 찾고 계신가요? 12가지 카테고리 그리드 */}
            <CategoryGrid
              categories={mockCategories}
              selectedCategory={selectedCategory?.name || null}
              onSelectCategory={(category) => setSelectedCategory(category)}
            />
          </div>
        )}

        {/* Tab 2: U (주변/둘러보기) */}
        {activeTab === 'explore' && (
          <div className="flex-1 overflow-y-auto">
            <ExploreView
              posts={activeMeetupPosts}
              onSelectPost={(post) => setSelectedPostForDetail(post)}
            />
          </div>
        )}

        {/* Tab 3: 채팅 */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col">
            <ChatView
              appointment={appointment}
              currentUser={currentUser}
              onOpenDashboard={() => setIsDashboardOpen(true)}
              onUpdateAppointment={handleUpdateAppointment}
              onOpenVoiceCall={() => setIsVoiceCallOpen(true)}
              onOpenSafetyRules={() => setIsSafetyRulesOpen(true)}
              onOpenReport={() => setIsReportOpen(true)}
              onOpenReview={handleOpenReview}
            />
          </div>
        )}

        {/* Tab 4: Me */}
        {activeTab === 'me' && (
          <div className="flex-1 overflow-y-auto">
            <MyPageView
              currentAppointment={appointment}
              onOpenDashboard={() => setIsDashboardOpen(true)}
              currentUser={currentUser}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onOpenKyc={() => setIsKycModalOpen(true)}
              onLogout={handleLogout}
              onUpdateAvatar={handleUpdateAvatar}
              reviews={reviews}
              escrowPayments={escrowPayments}
              sentRequests={sentRequests}
              receivedRequests={joinRequests}
              onAcceptRequest={handleAcceptRequest}
              onRejectRequest={handleRejectRequest}
              onExploreMeetups={() => setActiveTab('explore')}
            />
          </div>
        )}

        {/* Bottom Navigation Bar + FAB (+) Button */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={(tab) => setActiveTab(tab)}
          onOpenCreate={handleOpenCreateMeetup}
        />

        {/* Modal: 참여 대시보드 */}
        <DashboardModal
          appointment={appointment}
          isOpen={isDashboardOpen}
          onClose={() => setIsDashboardOpen(false)}
          onOpenChat={() => {
            setIsDashboardOpen(false);
            setActiveTab('chat');
          }}
          onOpenSafetyRules={() => setIsSafetyRulesOpen(true)}
          onOpenReport={() => setIsReportOpen(true)}
          onSendArrivalNotice={handleSendArrivalNotice}
          onOpenReview={handleOpenReview}
        />

        {/* Modal: 이벤트 전체보기 (가로 롤링 리스트 + 주차별 필터) */}
        <EventAllViewModal
          isOpen={isEventAllModalOpen}
          onClose={() => setIsEventAllModalOpen(false)}
          events={mockEventBanners}
          onSelectEvent={(event) => {
            setSelectedEvent(event);
          }}
          currentWeek={2}
        />

        {/* Modal: 이벤트 상세 & 불꽃축제 동행 모임 */}
        <EventDetailModal
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          relatedPosts={activeMeetupPosts.filter((p) => p.category === '축제' || p.category === '공연')}
          onJoinMeetup={handleStartJoinRequest}
        />

        {/* Modal: 카테고리별 동행 리스트 */}
        <CategoryDetailModal
          category={selectedCategory}
          isOpen={!!selectedCategory}
          onClose={() => setSelectedCategory(null)}
          posts={activeMeetupPosts}
          onOpenCreate={handleOpenCreateMeetup}
          onSelectPost={(post) => setSelectedPostForDetail(post)}
        />

        {/* Modal: 새 동행 모집하기 / 공고 수정하기 (FAB + 클릭 또는 공고 수정 시) */}
        <CreateMeetupModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingPost(null);
          }}
          onCreateMeetup={handleCreateMeetup}
          onUpdatePost={handleUpdatePost}
          editPost={editingPost}
          currentUser={currentUser}
        />

        {/* Modal: 공고 상세 및 비밀장소 마스킹 보호 (Phase 2) */}
        <PostDetailModal
          post={selectedPostForDetail}
          isOpen={Boolean(selectedPostForDetail)}
          onClose={() => setSelectedPostForDetail(null)}
          currentUser={currentUser}
          onJoinMeetup={handleStartJoinRequest}
          onOpenEscrow={handleOpenEscrow}
          onEditPost={handleEditPost}
          onClosePost={handleClosePost}
          onDeletePost={handleDeletePost}
        />

        {/* Phase 3 Modal: 1:1 동행 신청서 모달 (신청자) */}
        <JoinRequestModal
          post={selectedPostForJoin}
          isOpen={isJoinRequestModalOpen}
          onClose={() => {
            setIsJoinRequestModalOpen(false);
            setSelectedPostForJoin(null);
          }}
          currentUser={currentUser}
          currentAppointment={appointment}
          onSubmitRequest={handleSendJoinRequest}
        />

        {/* Phase 3 Modal: 받은 동행 신청 목록 & 1:1 매칭 확정 락 (호스트) */}
        <MatchRequestsModal
          isOpen={isMatchRequestsOpen}
          onClose={() => setIsMatchRequestsOpen(false)}
          requests={joinRequests}
          onAccept={handleAcceptRequest}
          onReject={handleRejectRequest}
        />

        {/* Phase 4 Modal: 안심 안전 5대 수칙 모달 */}
        <SafetyRulesModal
          isOpen={isSafetyRulesOpen}
          onClose={() => setIsSafetyRulesOpen(false)}
        />

        {/* Phase 4 Modal: 1:1 가상 안심 음성 통화 모달 */}
        <VoiceCallModal
          isOpen={isVoiceCallOpen}
          onClose={() => setIsVoiceCallOpen(false)}
          appointment={appointment}
        />

        {/* Phase 4 Modal: 긴급 신고 및 노쇼(No-Show) 센터 모달 */}
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          appointment={appointment}
          onSubmitReport={handleReportSubmit}
        />

        {/* Modal: 알림 창 */}
        <NotificationModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          notifications={notifications}
          onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        />

        {/* Modal: 회원가입 / 휴대폰 본인확인 (Phase 1) */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />

        {/* Modal: 선택형 KYC 본인확인 (Phase 1) */}
        <KycAuthModal
          isOpen={isKycModalOpen}
          onClose={() => setIsKycModalOpen(false)}
          isAlreadyVerified={currentUser?.isKycVerified || false}
          onKycSuccess={handleKycSuccess}
        />

        {/* Phase 5 Modal: 상호 블라인드 평가 및 실시간 당도 정산 모달 */}
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          appointment={appointment}
          onSubmitReview={handleSubmitReview}
          onSettleSugar={handleSettleSugar}
        />

        {/* Phase 6 Modal: PRO 1:1 안심 에스크로 결제 모달 */}
        <EscrowPaymentModal
          isOpen={isEscrowModalOpen}
          onClose={() => {
            setIsEscrowModalOpen(false);
            setSelectedProPostForEscrow(null);
          }}
          post={selectedProPostForEscrow}
          currentUser={currentUser}
          onPaymentSuccess={handleCompleteEscrowPayment}
        />
      </main>
    </div>
  );
}

