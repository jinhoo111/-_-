-- 0002_user_data_impulse_trades.sql
-- 목적: 뇌동매매(감정적 매매) 기록을 클라우드에 저장하기 위한 user_data.impulse_trades 컬럼 추가.
--
-- 배경: index.html의 _syncToCloud()가 user_data upsert 페이로드에 impulse_trades를 포함하는데
--       (커밋 99764dd "테스트 및 일부 수정"에서 뇌동매매 기능 추가),
--       프로덕션 DB에 해당 컬럼이 없어 upsert 전체가 400(column does not exist)으로 실패 →
--       클라우드 저장이 통째로 막힘(모든 사용자 데이터가 localStorage에만 잔존).
--
-- 적용: Supabase 대시보드 SQL 에디터에서 아래 문장 실행. (순수 추가·기본값 있어 무중단, 재실행 안전)
--
-- 참고: invest_philosophy(0008 세션)와 동일한 JSONB 배열 패턴.

ALTER TABLE user_data
  ADD COLUMN IF NOT EXISTS impulse_trades JSONB DEFAULT '[]'::jsonb;
