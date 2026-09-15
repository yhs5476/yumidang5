import React from 'react';
import { Bell, ShieldCheck } from 'lucide-react';

import logoImg from '../assets/logo.jpg';
import { CurrentUser } from '../types';

interface HeaderProps {
  unreadCount?: number;
  pendingRequestCount?: number;
  onOpenNotifications: () => void;
  currentUser: CurrentUser | null;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  unreadCount = 2,
  pendingRequestCount = 0,
  onOpenNotifications,
  currentUser,
  onOpenAuth,
}) => {
  const totalAlerts = unreadCount + pendingRequestCount;

  return (
    <header className="sticky top-0 z-30 bg-white px-5 py-3.5 flex items-center justify-between border-b border-transparent transition-all">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-2.5 select-none cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        {/* Stylized YouMeDang Mascot Icon */}
        <div className="w-9 h-9 rounded-full overflow-hidden shadow-sm flex-shrink-0 bg-[#6c2cf5] flex items-center justify-center">
          <img src={logoImg} alt="유미당 로고" className="w-full h-full object-cover" />
        </div>

        <span className="text-[22px] font-extrabold tracking-tight text-[#6c2cf5]">
          유미당
        </span>
      </div>

      {/* Right Action: Auth button & Single Notification Bell */}
      <div className="flex items-center gap-2">
        {currentUser && currentUser.isLoggedIn ? (
          <div className="flex items-center gap-1 px-3 py-1 bg-[#f0edff] rounded-full text-xs font-bold text-[#6c2cf5] shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#6c2cf5]" />
            <span>{currentUser.maskedName}</span>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-3 py-1 bg-[#6c2cf5] text-white text-xs font-bold rounded-lg hover:bg-[#5820d8] transition-colors shadow-xs"
          >
            로그인
          </button>
        )}

        {/* Unified Notification Bell */}
        <button
          id="btn-notifications"
          onClick={onOpenNotifications}
          className="relative p-2 text-gray-800 hover:text-[#6c2cf5] hover:bg-gray-50 rounded-full transition-colors active:scale-95"
          aria-label="통합 알림"
          title="알림"
        >
          <Bell className="w-[23px] h-[23px] stroke-[2]" />
          {totalAlerts > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[17px] h-[17px] px-1 bg-[#ff4b4b] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-in zoom-in-50">
              {totalAlerts > 9 ? '9+' : totalAlerts}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

