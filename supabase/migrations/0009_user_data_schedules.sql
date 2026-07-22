-- 0009_user_data_schedules.sql
-- 목적: 투자 일지 캘린더의 '개인 일정'(시간+제목)을 클라우드에 저장하기 위한
--       user_data.schedules 컬럼 추가.
--
-- 데이터 형태: [{id, date:'YYYY-MM-DD', time:'HH:MM'|'', title, memo}]
--       하루 여러 건 가능·시간순 정렬. 투자 판단 기록(memo_archive)과 분리되어
--       투자습관리포트·태그별 집계에는 포함되지 않는다(순수 개인 일정).
--
-- 적용: Supabase 대시보드 SQL 에디터에서 아래 문장 실행. (순수 추가·기본값 있어 무중단, 재실행 안전)
--
-- 참고: 이 컬럼이 없어도 앱은 정상 동작한다. index.html의 _syncToCloud()에
--       '없는 컬럼만 제외하고 재시도'하는 가드(_syncSkipCols)가 있어,
--       미적용 시에는 개인 일정만 localStorage에 남고 나머지 데이터는 정상 저장된다.
--       (0002 impulse_trades 때처럼 저장 전체가 400으로 막히는 일은 발생하지 않는다.)
--       마이그레이션을 실행하면 다음 저장부터 자동으로 클라우드에 올라간다.

ALTER TABLE user_data
  ADD COLUMN IF NOT EXISTS schedules JSONB DEFAULT '[]'::jsonb;
