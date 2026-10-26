-- 올짐 피트니스 예약 관리 시스템 스키마
-- PostgreSQL 14+

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 지점
CREATE TABLE IF NOT EXISTS branches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  location    TEXT,
  phone       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 사용자
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  phone       TEXT UNIQUE,
  kakao_id    TEXT UNIQUE,
  role        TEXT NOT NULL CHECK (role IN ('CUSTOMER','TRAINER','ADMIN')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ── 트레이너
CREATE TABLE IF NOT EXISTS trainers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id   UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  bio         TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trainers_branch ON trainers(branch_id);

-- ── 슬롯
CREATE TABLE IF NOT EXISTS time_slots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id     UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  trainer_id    UUID REFERENCES trainers(id) ON DELETE SET NULL,
  slot_date     DATE NOT NULL,
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  status        TEXT NOT NULL DEFAULT 'OPEN'
                  CHECK (status IN ('OPEN','LOCKED','FULL','BLOCKED','CLOSED')),
  max_capacity  INT  NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (branch_id, trainer_id, slot_date, start_time)
);

CREATE INDEX IF NOT EXISTS idx_slots_branch_date ON time_slots(branch_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_slots_status ON time_slots(status);

-- ── 예약
CREATE TABLE IF NOT EXISTS reservations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot_id       UUID NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'PENDING'
                  CHECK (status IN ('PENDING','CONFIRMED','REJECTED','CANCELLED','COMPLETED','NO_SHOW')),
  cancel_reason TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_slot ON reservations(slot_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- 동일 슬롯에 동일 사용자의 활성 예약은 1개로 제한
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_reservation
  ON reservations(user_id, slot_id)
  WHERE status IN ('PENDING','CONFIRMED');

-- ── 트레이너 메모
CREATE TABLE IF NOT EXISTS customer_memos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id   UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  customer_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 알림
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id  UUID REFERENCES reservations(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,
  channel         TEXT NOT NULL CHECK (channel IN ('KAKAO','SMS')),
  status          TEXT NOT NULL DEFAULT 'QUEUED'
                    CHECK (status IN ('QUEUED','SENT','FAILED','RETRYING')),
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 문서 (PDF, Word, 텍스트, 이미지 등 리더기용)
CREATE TABLE IF NOT EXISTS documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  file_name    TEXT NOT NULL,
  mime_type    TEXT NOT NULL,
  size_bytes   INT  NOT NULL,
  content      BYTEA NOT NULL,
  -- ALL: 모든 회원 / TRAINER: 트레이너+관리자 / ADMIN: 관리자만
  audience     TEXT NOT NULL DEFAULT 'ALL' CHECK (audience IN ('ALL','TRAINER','ADMIN')),
  uploaded_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_audience ON documents(audience, created_at DESC);
