-- ============================================================
-- 유미당(Yumidang) 코어 비즈니스 스키마
-- 마이그레이션 적용일: 2026-09-15
-- ============================================================

-- 0. 확장 기능 및 공통 함수 설정
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. 사용자 프로필 테이블 (auth.users 확장)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone VARCHAR(20) UNIQUE,
    real_name VARCHAR(50),
    nickname VARCHAR(50) NOT NULL,
    gender VARCHAR(20) CHECK (gender IN ('female', 'male', 'undisclosed')),
    age_group VARCHAR(20),
    neighborhood VARCHAR(100),
    sugar_content NUMERIC(4, 1) DEFAULT 50.0 CHECK (sugar_content >= 0 AND sugar_content <= 100),
    is_phone_verified BOOLEAN DEFAULT FALSE,
    is_kyc_verified BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    bio TEXT,
    referral_code VARCHAR(50),
    is_pro_host BOOLEAN DEFAULT FALSE,
    pro_specialty TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. AI 문화/팝업 이벤트 테이블
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    badge VARCHAR(50),
    sub_badge VARCHAR(50),
    category VARCHAR(50),
    week INT CHECK (week BETWEEN 1 AND 5),
    start_week INT,
    period VARCHAR(100),
    location VARCHAR(200),
    description TEXT,
    image_url TEXT,
    tag VARCHAR(100),
    is_ended BOOLEAN DEFAULT FALSE,
    ai_curated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 1:1 동행 모집 공고 테이블
CREATE TABLE IF NOT EXISTS public.meetup_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    meet_at TIMESTAMPTZ NOT NULL,
    public_location VARCHAR(200) NOT NULL,
    secret_location VARCHAR(200),
    partner_preferences TEXT,
    companion_type VARCHAR(20) DEFAULT 'free' CHECK (companion_type IN ('free', 'pro')),
    hourly_rate INT DEFAULT 0,
    pro_details JSONB,
    current_members INT DEFAULT 1 CHECK (current_members IN (1, 2)),
    max_members INT DEFAULT 2 CHECK (max_members = 2),
    status VARCHAR(20) DEFAULT 'recruiting' CHECK (status IN ('recruiting', 'closed', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS tr_meetup_posts_updated_at ON public.meetup_posts;
CREATE TRIGGER tr_meetup_posts_updated_at
    BEFORE UPDATE ON public.meetup_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_meetup_posts_host ON public.meetup_posts(host_id);
CREATE INDEX IF NOT EXISTS idx_meetup_posts_status ON public.meetup_posts(status);

-- 4. 1:1 동행 신청 테이블
CREATE TABLE IF NOT EXISTS public.join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.meetup_posts(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_post_requester UNIQUE (post_id, requester_id)
);

CREATE INDEX IF NOT EXISTS idx_join_requests_post ON public.join_requests(post_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_requester ON public.join_requests(requester_id);

-- 5. 확정된 1:1 약속 테이블
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.meetup_posts(id) ON DELETE CASCADE,
    host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    meet_at TIMESTAMPTZ NOT NULL,
    address_public VARCHAR(200) NOT NULL,
    address_secret VARCHAR(200),
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_host ON public.appointments(host_id);
CREATE INDEX IF NOT EXISTS idx_appointments_guest ON public.appointments(guest_id);

-- 6. 1:1 안심 채팅방 및 메시지
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID UNIQUE NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON public.chat_messages(room_id, created_at);

-- 7. 상호 블라인드 당도 평가 및 리뷰 테이블
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    badges JSONB DEFAULT '[]'::jsonb,
    comment TEXT,
    is_blind BOOLEAN DEFAULT TRUE,
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_appointment_reviewer UNIQUE (appointment_id, reviewer_id)
);

-- 8. 당도 변동 이력 테이블
CREATE TABLE IF NOT EXISTS public.sugar_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    delta NUMERIC(3, 1) NOT NULL,
    reason VARCHAR(200) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sugar_histories_user ON public.sugar_histories(user_id);

-- 9. 프로 동행 에스크로 결제 테이블
CREATE TABLE IF NOT EXISTS public.escrow_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    post_id UUID NOT NULL REFERENCES public.meetup_posts(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    hourly_rate INT NOT NULL,
    total_hours NUMERIC(3, 1) NOT NULL,
    total_amount INT NOT NULL,
    status VARCHAR(20) DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded')),
    payment_method VARCHAR(20) CHECK (payment_method IN ('kakaopay', 'tosspay', 'card')),
    paid_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetup_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sugar_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_payments ENABLE ROW LEVEL SECURITY;

-- 11. 기본 RLS 정책
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public events read access' AND tablename = 'events') THEN
        CREATE POLICY "Public events read access" ON public.events FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public profiles read access' AND tablename = 'profiles') THEN
        CREATE POLICY "Public profiles read access" ON public.profiles FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile' AND tablename = 'profiles') THEN
        CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own profile' AND tablename = 'profiles') THEN
        CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public meetup posts read access' AND tablename = 'meetup_posts') THEN
        CREATE POLICY "Public meetup posts read access" ON public.meetup_posts FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert post' AND tablename = 'meetup_posts') THEN
        CREATE POLICY "Authenticated users can insert post" ON public.meetup_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Host can update own post' AND tablename = 'meetup_posts') THEN
        CREATE POLICY "Host can update own post" ON public.meetup_posts FOR UPDATE USING (auth.uid() = host_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Participants can view join requests' AND tablename = 'join_requests') THEN
        CREATE POLICY "Participants can view join requests" ON public.join_requests FOR SELECT USING (
            auth.uid() = requester_id OR 
            auth.uid() IN (SELECT host_id FROM public.meetup_posts WHERE id = join_requests.post_id)
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can create join request' AND tablename = 'join_requests') THEN
        CREATE POLICY "Authenticated users can create join request" ON public.join_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Host or requester can update join request' AND tablename = 'join_requests') THEN
        CREATE POLICY "Host or requester can update join request" ON public.join_requests FOR UPDATE USING (
            auth.uid() = requester_id OR 
            auth.uid() IN (SELECT host_id FROM public.meetup_posts WHERE id = join_requests.post_id)
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Participants can view appointments' AND tablename = 'appointments') THEN
        CREATE POLICY "Participants can view appointments" ON public.appointments FOR SELECT USING (
            auth.uid() = host_id OR auth.uid() = guest_id
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Participants can view chat rooms' AND tablename = 'chat_rooms') THEN
        CREATE POLICY "Participants can view chat rooms" ON public.chat_rooms FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.appointments a 
                WHERE a.id = chat_rooms.appointment_id 
                AND (a.host_id = auth.uid() OR a.guest_id = auth.uid())
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Participants can view messages' AND tablename = 'chat_messages') THEN
        CREATE POLICY "Participants can view messages" ON public.chat_messages FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.chat_rooms r 
                JOIN public.appointments a ON a.id = r.appointment_id
                WHERE r.id = chat_messages.room_id 
                AND (a.host_id = auth.uid() OR a.guest_id = auth.uid())
            )
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Sender can insert message' AND tablename = 'chat_messages') THEN
        CREATE POLICY "Sender can insert message" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Review participants can read review' AND tablename = 'reviews') THEN
        CREATE POLICY "Review participants can read review" ON public.reviews FOR SELECT USING (
            auth.uid() = reviewer_id OR auth.uid() = target_id
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Reviewer can insert review' AND tablename = 'reviews') THEN
        CREATE POLICY "Reviewer can insert review" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own sugar histories' AND tablename = 'sugar_histories') THEN
        CREATE POLICY "Users can view own sugar histories" ON public.sugar_histories FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Participants can view escrow payments' AND tablename = 'escrow_payments') THEN
        CREATE POLICY "Participants can view escrow payments" ON public.escrow_payments FOR SELECT USING (
            auth.uid() = requester_id OR auth.uid() = host_id
        );
    END IF;
END $$;
