-- 0011_user_data_indices_settings.sql
-- 목적: Indices(지수·환율) 페이지의 섹션 표시/숨김 설정을 기기 간 동기화하기 위한
--       user_data.indices_settings 컬럼 추가. 레거시(index.html)는 이 설정을
--       localStorage에만 저장했으나, 재작성(web/)에서는 클라우드 동기화한다.
--
-- 데이터 형태: {kr, us, vix, rates, futures, crypto, fx, commodities} (boolean map)
--
-- 적용: Supabase 대시보드 SQL 에디터에서 아래 문장 실행. (순수 추가·기본값 있어 무중단, 재실행 안전)
--
-- 참고: 이 컬럼이 없어도 앱은 정상 동작한다(기본값으로 대체). 0009와 동일한 안전한
--       추가 패턴.

ALTER TABLE user_data
  ADD COLUMN IF NOT EXISTS indices_settings JSONB DEFAULT '{}'::jsonb;
