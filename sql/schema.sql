-- ============================================================
-- HKER 平台資料庫 schema
-- 用途：解決「會員資料遺失需重新註冊」與「手機/網站資料不同步」問題
-- 設計原則：所有資料都以 profiles.id（= auth.users.id）為單一事實來源，
-- 前端不論在手機或桌面登入，都是讀寫同一筆資料，天然達成跨裝置同步。
-- ============================================================

-- 1. 會員資料表（註冊時自動建立，避免「孤兒帳號」）
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text,
  points integer not null default 0,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 新會員註冊時，自動在 profiles 建立對應紀錄
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, points)
  values (new.id, new.email, 0)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 每次更新 profiles 時自動更新 updated_at，方便前端判斷資料是否為最新
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- Row Level Security：會員只能讀寫自己的資料，管理員可讀寫全部
alter table public.profiles enable row level security;

create policy "會員可讀取自己的資料"
  on public.profiles for select
  using (auth.uid() = id);

create policy "會員可更新自己的資料"
  on public.profiles for update
  using (auth.uid() = id);

create policy "管理員可讀取所有會員資料"
  on public.profiles for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

create policy "管理員可更新所有會員資料"
  on public.profiles for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));


-- 2. 積分異動紀錄（每次遊戲/活動增減積分都留一筆，方便管理員稽核與跨裝置對帳）
create table if not exists public.points_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  delta integer not null,
  reason text not null, -- 例如 'game:slot-machine' / 'admin:adjust' / 'like:news'
  created_at timestamptz not null default now()
);

alter table public.points_ledger enable row level security;

create policy "會員可讀取自己的積分紀錄"
  on public.points_ledger for select
  using (auth.uid() = user_id);

create policy "管理員可讀取所有積分紀錄"
  on public.points_ledger for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));


-- 3. 新聞資料表
create table if not exists public.news_posts (
  id bigint generated always as identity primary key,
  title_zh text not null,
  title_en text,
  content_zh text not null,
  content_en text,
  source_url text not null,
  source_name text,
  published_at timestamptz not null, -- 原新聞發布時間，用於「不可多於2天」的過濾
  posted_at timestamptz not null default now(), -- 機械人貼上本站的時間
  like_count integer not null default 0,
  share_count integer not null default 0
);

create index if not exists idx_news_posts_published_at on public.news_posts (published_at desc);

alter table public.news_posts enable row level security;

create policy "所有人可讀取新聞"
  on public.news_posts for select
  using (true);


-- 4. 新聞按讚紀錄（避免同一會員重複按讚灌水）
create table if not exists public.news_likes (
  news_id bigint not null references public.news_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (news_id, user_id)
);

alter table public.news_likes enable row level security;

create policy "會員可管理自己的按讚"
  on public.news_likes for all
  using (auth.uid() = user_id);


-- 5. 管理員公告
create table if not exists public.announcements (
  id bigint generated always as identity primary key,
  message text not null,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

create policy "所有人可讀取生效中的公告"
  on public.announcements for select
  using (is_active = true);

create policy "管理員可管理公告"
  on public.announcements for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));


-- 6. 每日訪客/註冊統計（給管理後台儀表板用）
create table if not exists public.daily_stats (
  stat_date date primary key default current_date,
  new_signups integer not null default 0,
  visitor_count integer not null default 0,
  news_posted_count integer not null default 0
);

alter table public.daily_stats enable row level security;

create policy "管理員可讀取每日統計"
  on public.daily_stats for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

-- 記錄訪客到訪（可由前端 middleware 或頁面 layout 呼叫）
create or replace function public.log_visit()
returns void as $$
begin
  insert into public.daily_stats (stat_date, visitor_count)
  values (current_date, 1)
  on conflict (stat_date) do update set visitor_count = daily_stats.visitor_count + 1;
end;
$$ language plpgsql security definer;

-- 新會員註冊時順便累計今日註冊數
create or replace function public.log_signup()
returns trigger as $$
begin
  insert into public.daily_stats (stat_date, new_signups)
  values (current_date, 1)
  on conflict (stat_date) do update set new_signups = daily_stats.new_signups + 1;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_profile_created_log_signup on public.profiles;
create trigger on_profile_created_log_signup
  after insert on public.profiles
  for each row execute procedure public.log_signup();

-- 今日發文數 +1（給新聞機械人每成功發佈一則新聞時呼叫）
create or replace function public.log_news_posted()
returns void as $$
begin
  insert into public.daily_stats (stat_date, news_posted_count)
  values (current_date, 1)
  on conflict (stat_date) do update set news_posted_count = daily_stats.news_posted_count + 1;
end;
$$ language plpgsql security definer;

-- 分享次數 +1（給 NewsShareLike 元件呼叫）
create or replace function public.increment_share_count(news_id_input bigint)
returns void as $$
begin
  update public.news_posts set share_count = share_count + 1 where id = news_id_input;
end;
$$ language plpgsql security definer;

-- 手動將某帳號設為管理員（請自行替換 email 後在 Supabase SQL editor 執行一次）
-- update public.profiles set is_admin = true where email = 'your-admin-email@example.com';
