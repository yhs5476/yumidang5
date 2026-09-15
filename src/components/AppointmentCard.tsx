import React, { useState } from 'react';
import { Clock, MapPin, ChevronRight, Sparkles } from 'lucide-react';
import { Appointment } from '../types';

interface AppointmentCardProps {
  appointments?: Appointment[];
  appointment?: Appointment;
  onOpenDashboard: (appointment: Appointment) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointments,
  appointment,
  onOpenDashboard,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // 1. 단일 또는 복수 약속 배열 취합
  const rawList: Appointment[] = appointments || (appointment ? [appointment] : []);

  // 2. D-day 7일 이하 필터링 (D-7 ~ D-day)
  const validAppointments = rawList.filter((appt) => {
    if (typeof appt.dDayDays === 'number') {
      return appt.dDayDays <= 7;
    }
    const match = appt.dDay.match(/D-(\d+)/i);
    if (match && match[1]) {
      return parseInt(match[1], 10) <= 7;
    }
    return true; // D-DAY 등 기본 통과
  });

  // 3. D-day 7일 이하 확정 약속이 없으면 홈에 리마인드 노출하지 않음
  if (validAppointments.length === 0) {
    return null;
  }

  // 4. 단일 약속일 경우 기존 단일 카드 형태로 노출
  if (validAppointments.length === 1) {
    const singleAppt = validAppointments[0];
    return (
      <section className="px-5 py-2">
        <div
          id="card-current-appointment"
          className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_6px_24px_rgba(108,44,245,0.07)]"
        >
          {/* Top Status Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#f0edff] px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                <span className="text-[12px] font-bold text-[#6c2cf5]">
                  {singleAppt.status}
                </span>
              </div>
              <span className="font-bold text-[15px] text-gray-900 tracking-tight">
                {singleAppt.dDay}
              </span>
            </div>

            <div className="bg-[#f0edff] text-[#6c2cf5] text-[12px] font-semibold px-2.5 py-0.5 rounded-full">
              {singleAppt.appointmentBadge}
            </div>
          </div>

          {/* Appointment Title */}
          <h3 className="font-bold text-[17px] text-gray-900 mt-3.5 mb-2.5 leading-snug">
            {singleAppt.title}
          </h3>

          {/* Details: Date & Location */}
          <div className="space-y-1.5 text-[13.5px] text-gray-600 font-medium">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#8b5cf6] flex-shrink-0" />
              <span>{singleAppt.dateTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#8b5cf6] flex-shrink-0" />
              <span>{singleAppt.location}</span>
            </div>
          </div>

          {/* Bottom CTA to Dashboard */}
          <div className="flex justify-end pt-3">
            <button
              id="btn-open-dashboard"
              onClick={() => onOpenDashboard(singleAppt)}
              className="flex items-center text-[#6c2cf5] hover:text-[#561fe0] text-[14px] font-semibold group cursor-pointer transition-colors"
            >
              <span>참여 대시보드 바로가기</span>
              <ChevronRight className="w-4 h-4 ml-0.5 transform group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </section>
    );
  }

  // 5. 복수 약속(2개 이상)일 경우 가로 롤링 캐러셀로 배치
  return (
    <section className="py-2">
      {/* Header */}
      <div className="px-5 flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#6c2cf5]" />
          <h3 className="text-xs font-bold text-gray-700">
            다가오는 1:1 확정 약속 ({validAppointments.length})
          </h3>
        </div>
        <span className="text-[11px] text-gray-400 font-medium">
          가로로 넘겨보세요 ↔
        </span>
      </div>

      {/* Horizontal Snap Rolling Container */}
      <div className="flex items-stretch gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory px-5 py-1">
        {validAppointments.map((appt, idx) => (
          <div
            key={appt.id}
            onClick={() => setActiveIndex(idx)}
            className="min-w-[85%] sm:min-w-[360px] snap-start flex-shrink-0 bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_24px_rgba(108,44,245,0.07)] transition-all flex flex-col justify-between border border-gray-100/70"
          >
            <div>
              {/* Top Status Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-[#f0edff] px-2.5 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                    <span className="text-[12px] font-bold text-[#6c2cf5]">
                      {appt.status}
                    </span>
                  </div>
                  <span className="font-bold text-[15px] text-gray-900 tracking-tight">
                    {appt.dDay}
                  </span>
                </div>

                <div className="bg-[#f0edff] text-[#6c2cf5] text-[12px] font-semibold px-2.5 py-0.5 rounded-full">
                  {appt.appointmentBadge}
                </div>
              </div>

              {/* Appointment Title */}
              <h3 className="font-bold text-[16px] text-gray-900 mt-3 mb-2 leading-snug line-clamp-1">
                {appt.title}
              </h3>

              {/* Details: Date & Location */}
              <div className="space-y-1 text-[13px] text-gray-600 font-medium">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#8b5cf6] flex-shrink-0" />
                  <span className="line-clamp-1">{appt.dateTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#8b5cf6] flex-shrink-0" />
                  <span className="line-clamp-1">{appt.location}</span>
                </div>
              </div>
            </div>

            {/* Bottom CTA to Dashboard */}
            <div className="flex justify-end pt-3 mt-1 border-t border-gray-50">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDashboard(appt);
                }}
                className="flex items-center text-[#6c2cf5] hover:text-[#561fe0] text-[13.5px] font-semibold group cursor-pointer transition-colors"
              >
                <span>참여 대시보드 바로가기</span>
                <ChevronRight className="w-4 h-4 ml-0.5 transform group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Indicator Bar */}
      <div className="flex items-center justify-center gap-1.5 mt-2.5">
        {validAppointments.map((_, idx) => (
          <div
            key={idx}
            className={`h-1 rounded-full transition-all duration-300 ${
              idx === activeIndex
                ? 'w-6 bg-[#6c2cf5]'
                : 'w-2 bg-gray-200'
            }`}
          />
        ))}
      </div>
    </section>
  );
};
