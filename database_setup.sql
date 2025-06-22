-- 1. 기존 스키마 초기화
-- 기존 테이블들을 안전하게 삭제합니다.
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.friends CASCADE;
DROP TABLE IF EXISTS public.workouts CASCADE;
DROP TABLE IF EXISTS public.meals CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 기존 타입들도 삭제합니다.
DROP TYPE IF EXISTS public.meal_time_type CASCADE;
DROP TYPE IF EXISTS public.friend_status CASCADE;

-- 기존 함수들도 삭제합니다.
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.search_users_with_friendship_status(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_user_total_activity_days(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_friends_with_details(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.are_friends(UUID, UUID) CASCADE;

-- 기존 트리거도 삭제합니다.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. 사용자 테이블 (Users)
-- Supabase의 auth.users와 1:1 관계를 맺는 공개 프로필 테이블입니다.
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname VARCHAR(50) NOT NULL UNIQUE,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.users IS '사용자 프로필 정보 (auth.users와 연결)';

-- 3. 식단 테이블 (Meals)
CREATE TYPE public.meal_time_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
CREATE TABLE public.meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_type public.meal_time_type NOT NULL,
    food_name VARCHAR(255) NOT NULL,
    image_url TEXT,
    calorie NUMERIC NOT NULL,
    carb NUMERIC NOT NULL,
    protein NUMERIC NOT NULL,
    fat NUMERIC NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. 운동 테이블 (Workouts)
CREATE TABLE public.workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    part TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    sets INTEGER,
    reps INTEGER,
    weight NUMERIC,
    speed NUMERIC,
    duration_minutes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. 친구 테이블 (Friends)
CREATE TYPE public.friend_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TABLE public.friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status public.friend_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_different_users CHECK (requester_id <> receiver_id)
);

-- 6. 메시지 테이블 (Messages)
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. RLS (Row Level Security) 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 8. UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 9. 친구 관계 확인 헬퍼 함수 (RLS 정책에서 사용됨)
CREATE OR REPLACE FUNCTION public.are_friends(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.friends
        WHERE
            ((requester_id = user1_id AND receiver_id = user2_id) OR
             (requester_id = user2_id AND receiver_id = user1_id))
        AND status = 'accepted'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. RLS 정책 설정
-- 기존 정책을 삭제하고 더 세분화된 정책을 적용합니다.
DROP POLICY IF EXISTS "Users can manage their own meal records." ON public.meals;
DROP POLICY IF EXISTS "Users can manage their own workout records." ON public.workouts;

CREATE POLICY "Public user profiles are viewable by everyone." ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

-- 식단(Meals) 테이블 정책
CREATE POLICY "view meals" ON public.meals FOR SELECT USING (auth.uid() = user_id OR public.are_friends(auth.uid(), user_id));
CREATE POLICY "insert meals" ON public.meals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update meals" ON public.meals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete meals" ON public.meals FOR DELETE USING (auth.uid() = user_id);

-- 운동(Workouts) 테이블 정책
CREATE POLICY "view workouts" ON public.workouts FOR SELECT USING (auth.uid() = user_id OR public.are_friends(auth.uid(), user_id));
CREATE POLICY "insert workouts" ON public.workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update workouts" ON public.workouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete workouts" ON public.workouts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own friend relationships." ON public.friends FOR ALL USING (auth.uid() = requester_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can manage their own messages." ON public.messages FOR ALL USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 11. 자동화 함수 및 트리거 생성
-- 새 사용자가 가입하면 public.users 테이블에 자동으로 프로필을 생성합니다.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, nickname, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'nickname', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 12. 친구 검색 함수
-- 사용자를 닉네임으로 검색하고, 현재 사용자와의 친구 관계 상태를 함께 반환합니다.
CREATE OR REPLACE FUNCTION public.search_users_with_friendship_status(
    p_current_user_id UUID,
    p_search_term TEXT
)
RETURNS TABLE (
    id UUID,
    nickname VARCHAR,
    avatar_url TEXT,
    friend_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.nickname,
        u.avatar_url,
        CASE
            WHEN f.status = 'accepted' THEN 'friends'
            WHEN f.status = 'pending' AND f.requester_id = p_current_user_id THEN 'pending_sent'
            WHEN f.status = 'pending' AND f.receiver_id = p_current_user_id THEN 'pending_received'
            ELSE 'not_friends'
        END::TEXT AS friend_status
    FROM
        public.users u
    LEFT JOIN
        public.friends f ON (f.requester_id = p_current_user_id AND f.receiver_id = u.id) OR (f.requester_id = u.id AND f.receiver_id = p_current_user_id)
    WHERE
        u.nickname ILIKE '%' || p_search_term || '%'
        AND u.id <> p_current_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. 총 활동일 계산 및 친구 목록 조회 함수
-- 사용자의 총 활동일을 계산하는 함수
CREATE OR REPLACE FUNCTION public.calculate_user_total_activity_days(p_user_id UUID)
RETURNS INT AS $$
DECLARE
    total_days INT;
BEGIN
    SELECT COUNT(DISTINCT activity_date)
    INTO total_days
    FROM (
        SELECT date AS activity_date FROM public.meals WHERE user_id = p_user_id
        UNION
        SELECT date AS activity_date FROM public.workouts WHERE user_id = p_user_id
    ) AS all_activities;

    RETURN total_days;
END;
$$ LANGUAGE plpgsql;

-- 친구 목록과 각 친구의 총 활동일을 함께 가져오는 메인 함수
CREATE OR REPLACE FUNCTION public.get_friends_with_details(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    nickname VARCHAR,
    avatar_url TEXT,
    total_activity_days INT
) AS $$
BEGIN
    RETURN QUERY
    WITH friend_ids AS (
        SELECT receiver_id AS friend_id FROM public.friends WHERE requester_id = p_user_id AND status = 'accepted'
        UNION
        SELECT requester_id AS friend_id FROM public.friends WHERE receiver_id = p_user_id AND status = 'accepted'
    )
    SELECT
        u.id,
        u.nickname,
        u.avatar_url,
        public.calculate_user_total_activity_days(u.id) AS total_activity_days
    FROM
        public.users u
    JOIN
        friend_ids fi ON u.id = fi.friend_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 