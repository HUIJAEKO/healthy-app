-- Supabase 데이터베이스 재설정 스크립트
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요.
-- 기존 테이블을 모두 삭제하고 새로 생성하므로, 데이터가 있는 경우 주의하세요.

-- 1. 기존 스키마 초기화
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.friends CASCADE;
DROP TABLE IF EXISTS public.workouts CASCADE;
DROP TABLE IF EXISTS public.meals CASCADE;
DROP TABLE IF EXISTS public.users CASCADE; -- profiles 대신 users 사용
DROP TYPE IF EXISTS public.friend_status;
DROP TYPE IF EXISTS public.meal_time_type;

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

-- 8. RLS 정책 설정
CREATE POLICY "Public user profiles are viewable by everyone." ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage their own meal records." ON public.meals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own workout records." ON public.workouts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own friend relationships." ON public.friends FOR ALL USING (auth.uid() = requester_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can manage their own messages." ON public.messages FOR ALL USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 9. 자동화 함수 및 트리거 생성
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

-- 10. UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; 