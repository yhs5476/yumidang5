import React, { useState, useRef, useEffect } from 'react';
import { Send, MapPin, Clock, CheckCheck, Info, CalendarClock, Check, X, Sparkles, PhoneCall, ShieldCheck, ShieldAlert, AlertTriangle, Star, Wifi, UserCheck, Edit3 } from 'lucide-react';
import { Appointment, ScheduleProposal, CurrentUser } from '../types';
import { supabase } from '../lib/supabase';

interface ChatViewProps {
  appointment: Appointment;
  currentUser?: CurrentUser | null;
  onOpenDashboard: () => void;
  onUpdateAppointment?: (newSchedule: { dateTime: string; location: string }) => void;
  onOpenVoiceCall?: () => void;
  onOpenSafetyRules?: () => void;
  onOpenReport?: () => void;
  onOpenReview?: () => void;
}

interface Message {
  id: string;
  sender: 'me' | 'partner';
  senderId?: string;
  senderName?: string;
  text: string;
  time: string;
  proposal?: ScheduleProposal;
}

export const ChatView: React.FC<ChatViewProps> = ({
  appointment,
  currentUser,
  onOpenDashboard,
  onUpdateAppointment,
  onOpenVoiceCall,
  onOpenSafetyRules,
  onOpenReport,
  onOpenReview,
}) => {
  // 1. 내 식별자 및 닉네임 (로그인 회원 또는 기기별 게스트 식별자)
  const [myId, setMyId] = useState<string>(() => {
    if (currentUser?.isLoggedIn && currentUser.id) return currentUser.id;
    let stored = localStorage.getItem('yumidang_chat_guest_id');
    if (!stored) {
      stored = 'user_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('yumidang_chat_guest_id', stored);
    }
    return stored;
  });

  const [myName, setMyName] = useState<string>(() => {
    if (currentUser?.isLoggedIn) return currentUser.nickname || currentUser.maskedName || '나';
    let stored = localStorage.getItem('yumidang_chat_guest_name');
    if (!stored) {
      stored = '동행이웃_' + Math.floor(1000 + Math.random() * 9000);
      localStorage.setItem('yumidang_chat_guest_name', stored);
    }
    return stored;
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const [newNameInput, setNewNameInput] = useState('');
  const [isEditingId, setIsEditingId] = useState(false);
  const [newIdInput, setNewIdInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [proposedDateTime, setProposedDateTime] = useState('2026.9.12(토) 15:00');
  const [proposedLocation, setProposedLocation] = useState(appointment.location);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const roomKey = appointment.id || 'appt-gangnam-brunch';

  // CurrentUser 변경 시 내 식별자 동기화
  useEffect(() => {
    if (currentUser?.isLoggedIn && currentUser.id) {
      setMyId(currentUser.id);
      setMyName(currentUser.nickname || currentUser.maskedName || '나');
    }
  }, [currentUser]);

  // 시간 포맷 헬퍼
  const formatTime = (isoString?: string) => {
    if (!isoString) return '방금';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '방금';
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  // 2. Supabase DB 주기적 폴링 (Polling) 방식으로 메시지 동기화
  useEffect(() => {
    let isMounted = true;

    const pollMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('room_key', roomKey)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('메시지 폴링 실패:', error);
          if (isMounted) setIsConnected(false);
          return;
        }

        if (isMounted && data) {
          setIsConnected(true);
          const mapped: Message[] = data.map((item: any) => ({
            id: item.id,
            sender: item.sender_id === myId ? 'me' : 'partner',
            senderId: item.sender_id,
            senderName: item.sender_name || (item.sender_id === myId ? myName : appointment.partnerName),
            text: item.message,
            time: formatTime(item.created_at),
          }));

          // 불필요한 리렌더링 방지: 마지막 메시지 ID 또는 개수가 다를 때만 갱신
          setMessages((prev) => {
            if (prev.length === mapped.length && prev[prev.length - 1]?.id === mapped[mapped.length - 1]?.id) {
              return prev;
            }
            return mapped;
          });
        }
      } catch (err) {
        console.error('메시지 폴링 예외:', err);
        if (isMounted) setIsConnected(false);
      }
    };

    // 첫 진입 시 즉시 1회 호출
    pollMessages();

    // 1.5초마다 폴링 실행 (HTTP GET)
    const intervalId = setInterval(pollMessages, 1500);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [roomKey, myId, myName, appointment.partnerName]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 3. 메시지 전송 (Supabase DB INSERT -> 실시간 브로드캐스트)
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed || isSending) return;

    setInputVal('');
    setIsSending(true);

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_key: roomKey,
          sender_id: myId,
          sender_name: myName,
          message: trimmed,
        })
        .select()
        .single();

      if (error) {
        console.error('메시지 전송 에러:', error);
        // DB 전송 실패 시 로컬에서라도 유지
        setMessages((prev) => [
          ...prev,
          {
            id: 'local-' + Date.now(),
            sender: 'me',
            senderName: myName,
            text: trimmed,
            time: '방금',
          },
        ]);
      } else if (data) {
        // 성공 시 상태에 즉시 반영 (Realtime 중복 방지 로직 적용됨)
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [
            ...prev,
            {
              id: data.id,
              sender: 'me',
              senderId: myId,
              senderName: myName,
              text: data.message,
              time: formatTime(data.created_at),
            },
          ];
        });
      }
    } catch (err) {
      console.error('메시지 전송 예외:', err);
    } finally {
      setIsSending(false);
    }
  };

  // 닉네임 변경 저장
  const handleSaveName = () => {
    if (newNameInput.trim()) {
      const updated = newNameInput.trim();
      setMyName(updated);
      localStorage.setItem('yumidang_chat_guest_name', updated);
      setIsEditingName(false);
    }
  };

  // ID 변경 저장
  const handleSaveId = () => {
    if (newIdInput.trim()) {
      const updated = newIdInput.trim();
      setMyId(updated);
      localStorage.setItem('yumidang_chat_guest_id', updated);
      setIsEditingId(false);
    }
  };

  // 일정 제안 전송
  const handleSendProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposedDateTime.trim() || !proposedLocation.trim()) return;

    const proposalText = `[일정/장소 변경 제안] 📅 ${proposedDateTime.trim()} / 📍 ${proposedLocation.trim()} (으)로 변경을 제안합니다.`;

    try {
      await supabase.from('chat_messages').insert({
        room_key: roomKey,
        sender_id: myId,
        sender_name: myName,
        message: proposalText,
      });
      setIsProposalModalOpen(false);
    } catch (err) {
      console.error('제안 전송 에러:', err);
    }
  };

  const handleAcceptProposal = (msgId: string, proposal: ScheduleProposal) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === msgId && msg.proposal) {
          return {
            ...msg,
            proposal: { ...msg.proposal, status: 'accepted' },
          };
        }
        return msg;
      })
    );

    if (onUpdateAppointment) {
      onUpdateAppointment({
        dateTime: proposal.newDateTime,
        location: proposal.newLocation,
      });
    }

    setMessages((prev) => [
      ...prev,
      {
        id: 'm-' + Date.now(),
        sender: 'me',
        text: '제안해주신 일정 변경을 수락했습니다! 약속 정보가 즉시 업데이트되었습니다.',
        time: '방금',
      },
    ]);
  };

  const handleRejectProposal = (msgId: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === msgId && msg.proposal) {
          return {
            ...msg,
            proposal: { ...msg.proposal, status: 'rejected' },
          };
        }
        return msg;
      })
    );

    setMessages((prev) => [
      ...prev,
      {
        id: 'm-' + Date.now(),
        sender: 'me',
        text: '죄송하지만 해당 시간은 어려울 것 같아요. 기존 일정대로 진행하면 좋을 것 같습니다!',
        time: '방금',
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-125px)] bg-[#f6f7fb] text-left">
      {/* Top Polling Status & My Profile Bar */}
      <div className="bg-slate-900 text-white px-4 py-1.5 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className="font-medium text-slate-200">
            {isConnected ? '폴링 동기화 중 (1.5초 주기)' : '서버 연결 중...'}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">방 ID: {roomKey}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-purple-400" />
          {isEditingName ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newNameInput}
                onChange={(e) => setNewNameInput(e.target.value)}
                placeholder={myName}
                className="bg-slate-800 text-white text-[11px] px-1.5 py-0.5 rounded border border-slate-700 w-24 outline-none focus:border-purple-400"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                className="bg-purple-600 hover:bg-purple-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold"
              >
                저장
              </button>
              <button
                onClick={() => setIsEditingName(false)}
                className="text-slate-400 hover:text-white px-1 text-[10px]"
              >
                취소
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-slate-300">내 닉네임:</span>
              <span className="font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded">{myName}</span>
              <button
                onClick={() => {
                  setNewNameInput(myName);
                  setIsEditingName(true);
                }}
                title="닉네임 변경 (다른 사용자로 테스트)"
                className="text-slate-400 hover:text-purple-300 p-0.5"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            </div>
          )}
        {/* ID display and edit */}
        <div className="flex items-center gap-1">
          <span className="text-slate-300">내 ID:</span>
          {isEditingId ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newIdInput}
                onChange={(e) => setNewIdInput(e.target.value)}
                placeholder={myId}
                className="bg-slate-800 text-white text-[11px] px-1.5 py-0.5 rounded border border-slate-700 w-24 outline-none focus:border-purple-400"
                autoFocus
              />
              <button
                onClick={handleSaveId}
                className="bg-purple-600 hover:bg-purple-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold"
              >
                저장
              </button>
              <button
                onClick={() => setIsEditingId(false)}
                className="text-slate-400 hover:text-white px-1 text-[10px]"
              >
                취소
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded">{myId}</span>
              <button
                onClick={() => {
                  setNewIdInput(myId);
                  setIsEditingId(true);
                }}
                title="ID 변경 (다른 사용자로 테스트)"
                className="text-slate-400 hover:text-purple-300 p-0.5"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Top Partner Header */}
      <div className="bg-white px-4 py-3 shadow-xs flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <img
              src={appointment.partnerAvatar}
              alt={appointment.partnerName}
              className="w-10 h-10 rounded-full object-cover shadow-2xs"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-[14.5px] text-gray-900">{appointment.partnerName}</h3>
              <span className="text-[10px] font-bold text-[#6c2cf5] bg-[#f0edff] px-1.5 py-0.5 rounded">
                1:1 동행
              </span>
            </div>
            <p className="text-[11px] text-gray-500">당도 99 🍯 • 안심 조율방</p>
          </div>
        </div>

        {/* Action Button Group */}
        <div className="flex items-center gap-1">
          {/* Voice Call Simulation Button */}
          {onOpenVoiceCall && (
            <button
              onClick={onOpenVoiceCall}
              title="안심 음성 통화"
              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors active:scale-95"
            >
              <PhoneCall className="w-4 h-4" />
            </button>
          )}

          {/* Safety Rules Button */}
          {onOpenSafetyRules && (
            <button
              onClick={onOpenSafetyRules}
              title="안심 안전 5대 수칙"
              className="p-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-colors active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
          )}

          {/* Report Button */}
          {onOpenReport && (
            <button
              onClick={onOpenReport}
              title="파트너 비매너 신고"
              className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors active:scale-95"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setIsProposalModalOpen(true)}
            className="text-xs font-bold text-[#6c2cf5] bg-[#f0edff] hover:bg-[#e4dcfa] px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
          >
            <CalendarClock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">제안</span>
          </button>
          <button
            onClick={onOpenDashboard}
            className="text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">약속</span>
          </button>
        </div>
      </div>

      {/* Appointment mini-summary bar (Dynamic reflection) */}
      <div className="bg-white/90 backdrop-blur-xs px-4 py-2.5 shadow-2xs flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#6c2cf5]" />
          <span className="font-bold text-gray-900">{appointment.dateTime}</span>
          <span className="text-gray-300">|</span>
          <MapPin className="w-3.5 h-3.5 text-[#6c2cf5]" />
          <span className="truncate max-w-[150px] font-semibold text-gray-800">{appointment.location}</span>
        </div>
        {onOpenReview ? (
          <button
            onClick={onOpenReview}
            className="font-bold text-[11px] text-white bg-gradient-to-r from-[#6c2cf5] to-[#8b5cf6] px-3 py-1 rounded-full shadow-xs hover:shadow-sm active:scale-95 transition-all flex items-center gap-1 shrink-0"
          >
            <span>만남 완료 & 평가</span>
            <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
          </button>
        ) : (
          <span className="font-bold text-[#6c2cf5] bg-[#f0edff] px-2.5 py-0.5 rounded-full shrink-0">
            확정됨 (2/2명)
          </span>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Safety Tip */}
        <div className="bg-white/80 rounded-2xl p-3.5 shadow-2xs text-center text-xs text-gray-500 space-y-0.5">
          <p className="font-semibold text-gray-700">🔒 안전한 1:1 동행을 위한 안심 대화방입니다</p>
          <p>시간이나 장소 조정은 상단의 [일정/장소 제안] 기능을 이용해 상호 동의 하에 안전하게 변경하세요.</p>
        </div>

        {messages.map((msg) => {
          const isMe = msg.sender === 'me';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              {/* Proposal Card Rendering */}
              {msg.proposal ? (
                <div
                  className={`w-full max-w-[320px] rounded-2xl p-4 shadow-sm text-xs space-y-2.5 ${
                    isMe
                      ? 'bg-[#f5f3ff] text-gray-900'
                      : 'bg-white text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="font-bold text-[#6c2cf5] flex items-center gap-1 text-[11px]">
                      <CalendarClock className="w-3.5 h-3.5" />
                      1:1 조건 변경 제안
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        msg.proposal.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-700'
                          : msg.proposal.status === 'rejected'
                          ? 'bg-gray-100 text-gray-500'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {msg.proposal.status === 'accepted'
                        ? '수락 완료'
                        : msg.proposal.status === 'rejected'
                        ? '제안 거절됨'
                        : '수락 대기중'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-gray-700">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-gray-500">시간:</span>
                      <span className="font-bold text-gray-900">{msg.proposal.newDateTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-gray-500">장소:</span>
                      <span className="font-bold text-gray-900">{msg.proposal.newLocation}</span>
                    </div>
                  </div>

                  {msg.proposal.status === 'pending' && !isMe && (
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleRejectProposal(msg.id)}
                        className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-bold text-center transition-colors"
                      >
                        거절
                      </button>
                      <button
                        onClick={() => handleAcceptProposal(msg.id, msg.proposal!)}
                        className="flex-1 py-2 bg-[#6c2cf5] hover:bg-[#5820d8] text-white rounded-xl font-bold text-center flex items-center justify-center gap-1 shadow-xs transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        수락하기
                      </button>
                    </div>
                  )}

                  {msg.proposal.status === 'pending' && isMe && (
                    <p className="text-[10.5px] text-gray-400 text-center pt-2">
                      상대방이 수락하면 약속 정보가 즉시 변경됩니다.
                    </p>
                  )}

                  {msg.proposal.status === 'accepted' && (
                    <p className="text-[10.5px] text-emerald-600 font-bold text-center pt-1">
                      ✓ 상호 동의로 일정이 변경되었습니다
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col">
                  {!isMe && (
                    <span className="text-[11px] font-bold text-gray-600 mb-1 px-1">
                      {msg.senderName || appointment.partnerName}
                    </span>
                  )}
                  <div
                    className={`max-w-[78%] px-4 py-2.5 rounded-[20px] text-[13.5px] leading-relaxed shadow-2xs ${
                      isMe
                        ? 'bg-[#6c2cf5] text-white rounded-tr-xs ml-auto'
                        : 'bg-white text-gray-900 rounded-tl-xs mr-auto'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1 mt-1 text-[10.5px] text-gray-400 px-1">
                <span>{msg.time}</span>
                {isMe && <CheckCheck className="w-3 h-3 text-[#6c2cf5]" />}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <form
        onSubmit={handleSend}
        className="bg-white p-3 shadow-[0_-2px_12px_rgba(0,0,0,0.03)] flex items-center gap-2"
      >
        <button
          type="button"
          onClick={() => setIsProposalModalOpen(true)}
          title="일정/장소 제안하기"
          className="p-2 text-gray-500 hover:text-[#6c2cf5] hover:bg-purple-50 rounded-full transition-colors"
        >
          <CalendarClock className="w-5 h-5" />
        </button>
        <input
          type="text"
          placeholder="메시지를 입력하세요..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-xs sm:text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#6c2cf5]"
        />
        <button
          type="submit"
          className="w-9 h-9 rounded-full bg-[#6c2cf5] text-white flex items-center justify-center hover:bg-[#5820d8] active:scale-95 transition-all shadow-xs"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Schedule Change Proposal Modal */}
      {isProposalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div
            className="bg-white w-full max-w-[380px] rounded-3xl p-5 shadow-2xl animate-in zoom-in-95 duration-200 text-left space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-[#6c2cf5] flex items-center justify-center">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">일정 / 장소 변경 제안</h4>
              </div>
              <button
                onClick={() => setIsProposalModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendProposal} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">새로운 날짜 및 시간</label>
                <input
                  type="text"
                  value={proposedDateTime}
                  onChange={(e) => setProposedDateTime(e.target.value)}
                  placeholder="예: 2026.9.12(토) 15:30"
                  className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl focus:outline-none focus:bg-white focus:ring-1.5 focus:ring-[#6c2cf5] text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">새로운 만남 장소</label>
                <input
                  type="text"
                  value={proposedLocation}
                  onChange={(e) => setProposedLocation(e.target.value)}
                  placeholder="예: 강남역 11번 출구 스타벅스"
                  className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl focus:outline-none focus:bg-white focus:ring-1.5 focus:ring-[#6c2cf5] text-gray-900"
                  required
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-xl text-[11px] text-gray-500 leading-relaxed">
                제안 카드가 상대방에게 전송되며, 상대방이 [수락] 버튼을 누르면 약속 카드 정보가 즉시 업데이트됩니다.
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProposalModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-600 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#6c2cf5] hover:bg-[#5820d8] text-white rounded-xl font-bold shadow-sm shadow-purple-500/20 active:scale-98 transition-all"
                >
                  제안 전송하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

