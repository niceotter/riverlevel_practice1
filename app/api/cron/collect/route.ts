// app/api/cron/collect/route.ts
// cron-job.org에서 10분마다 호출
// 서울/부산 API 데이터를 수집해서 Supabase에 저장

import { NextResponse } from 'next/server';

const SUPABASE_URL     = process.env.SUPABASE_URL!;
const SUPABASE_API_KEY = process.env.SUPABASE_ANON_KEY!;

// ── Supabase REST API 헬퍼 ────────────────────────────
// Supabase에 HTTP 요청을 보내는 공통 함수
async function supabase(path: string, options?: RequestInit) {
  return fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_API_KEY,
      'Authorization': `Bearer ${SUPABASE_API_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
      ...options?.headers,
    },
  });
}

// 높이 순서...??
// 제방       EBM_HGT 
// 계획       PLAN_FLDE
// 통제/위험   alertLevel4 == CNTRL_WATL
// 경계       alertLevel3 
// 주의       alertLevel2
// 둔치       alertLevel1
// 바닥       RBH

// ── 마지막 저장 관측시간 조회 ────────────────────────
// 특정 관측소의 가장 최근 저장된 관측시간을 가져옴
// 이전 관측시간과 동일하면 저장 안 함 (중복 방지)
async function getLastObservedAt(siteCode: string): Promise<string | null> {
  const res = await supabase(
    `/water_levels?site_code=eq.${encodeURIComponent(siteCode)}&order=recorded_at.desc&limit=1`,
    { method: 'GET' }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data[0]?.observed_at ?? null;
}

// ── 수위 데이터 저장 ──────────────────────────────────
// water_levels 테이블에 한 행 삽입
// 컬럼 설명:
//   region       - 'seoul' 또는 'busan'
//   site_code    - 관측소 고유 코드
//   site_name    - 관측소 이름 (서울: 하천명+수위계명, 부산: 수위계명)
//   water_level  - 현재 수위 (m)
//   warn_level   - 경고 수위 (m) / 서울: CNTRL_WATL, 부산: alertLevel3
//   danger_level - 위험 수위 (m) / 서울: PLAN_FLDE, 부산: alertLevel4
//   observed_at  - API에서 제공하는 실제 관측 시각
//   recorded_at  - Supabase에 저장된 시각 (자동, DEFAULT NOW())
async function saveLevel(
  region:      string,
  siteCode:    string,
  siteName:    string,
  waterLevel:  number,
  warnLevel:   number | null,
  dangerLevel: number | null,
  observedAt:  string | null,
) {
  await supabase('/water_levels', {
    method: 'POST',
    body: JSON.stringify({
      region,
      site_code:    siteCode,
      site_name:    siteName,
      water_level:  waterLevel,
      warn_level:   warnLevel,
      danger_level: dangerLevel,
      observed_at:  observedAt,
    }),
  });
}

// ── 서울 데이터 수집 ──────────────────────────────────
// 서울 열린데이터광장 하천수위 API 호출
// API 응답 필드:
//   WATG_CD            - 관측소 코드
//   WATG_NM            - 수위계 이름
//   RVR_NM             - 하천명 (예: 불광천)
//   RLTM_RVR_WATL_CNT  - 현재 수위 (m)
//   CNTRL_WATL         - 통제수위 = 경고수위 (m)
//   PLAN_FLDE          - 계획홍수위 = 위험수위 (m)
//   DTRSM_DATA_CLCT_TM - 관측 시각 (예: 2026-07-05 14:30:00)

//   RBH, CNTRL_WATL, PLAN_FLDE, EBM_HGT 순서로 바닥, 통제, 계획, 제방
async function collectSeoul() {
  const apiKey = process.env.SEOUL_API_KEY!;
  const apiUrl = process.env.SEOUL_API_URL!;
  const res = await fetch(`${apiUrl}/${apiKey}/json/ListRiverStageService/1/50`);
  if (!res.ok) return;
  const data = await res.json();
  const rows = data?.ListRiverStageService?.row ?? [];

  for (const row of rows) {
    const level  = parseFloat(row.RLTM_RVR_WATL_CNT);
    // CNTRL_WATL이 0이면 경고수위 없는 것으로 처리
    const warn   = parseFloat(row.CNTRL_WATL);
    const danger = parseFloat(row.PLAN_FLDE);
    if (isNaN(level)) continue;

    // 이전 관측시간과 동일하면 저장 안 함
    const lastObservedAt = await getLastObservedAt(row.WATG_CD);
    if (lastObservedAt === null || lastObservedAt !== row.DTRSM_DATA_CLCT_TM) {
      await saveLevel(
        'seoul',
        row.WATG_CD,
        // 서울: 하천명 + 수위계명 (예: 불광천 증산교)
        `${row.RVR_NM} ${row.WATG_NM}`,
        level,
        isNaN(warn)   || warn === 0   ? null : warn,
        isNaN(danger) ? null : danger,
        row.DTRSM_DATA_CLCT_TM ?? null,
      );
    }
  }
}


// ── 부산 데이터 수집 ──────────────────────────────────
// 공공데이터포털 부산 하천수위 API 호출
// API 응답 필드:
//   siteCode    - 관측소 코드 (예: 00-200-0005)
//   siteName    - 수위계 이름 (예: 동백천)
//   waterLevel  - 현재 수위 (m)
//   alertLevel3 - 경계수위 = 경고수위 (m)
//   alertLevel4 - 위험수위 (m)
//   obsrTime    - 관측 시각 (예: 2026-07-05 14:59)

//   alertLevel1, alertLevel2, alertLevel3, alertLevel4 순서로 둔치, 주의, 경계, 위험
async function collectBusan() {
  const apiKey = process.env.BUSAN_API_KEY!;
  const apiUrl = process.env.BUSAN_API_URL!;
  const params = new URLSearchParams({
    serviceKey: apiKey,
    resultType: 'json',
    pageNo: '1',
    numOfRows: '30',
  });
  const res = await fetch(`${apiUrl}?${params}`);
  if (!res.ok) return;
  const data = await res.json();
  const items = data?.response?.body?.items?.item ?? [];

  for (const item of items) {
    const level  = parseFloat(item.waterLevel);
    const warn   = parseFloat(item.alertLevel3);
    const danger = parseFloat(item.alertLevel4);
    if (isNaN(level)) continue;

    // 이전 관측시간과 동일하면 저장 안 함
    const lastObservedAt = await getLastObservedAt(item.siteCode);
    if (lastObservedAt === null || lastObservedAt !== item.obsrTime) {
      await saveLevel(
        'busan',
        item.siteCode,
        // 부산: 수위계 이름만 (예: 동백천)
        item.siteName,
        level,
        isNaN(warn)   ? null : warn,
        isNaN(danger) ? null : danger,
        item.obsrTime ?? null,
      );
    }
  }
}

// ── 메인 핸들러 ───────────────────────────────────────
// cron-job.org에서 GET 요청으로 호출
// Authorization: Bearer {CRON_SECRET} 헤더로 인증
export async function GET(request: Request) {
  // 인증 확인
  // CRON_SECRET: Vercel 환경변수에 설정한 값
  // cron-job.org의 요청 헤더에 Authorization: Bearer {CRON_SECRET} 설정 필요
  const authHeader = request.headers.get('authorization') ??
                     request.headers.get('Authorization');
  const secret   = process.env.CRON_SECRET?.trim();
  const incoming = authHeader?.replace('Bearer ', '').trim();

  if (!secret || incoming !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 서울/부산 동시 수집
    await Promise.all([collectSeoul(), collectBusan()]);
    return NextResponse.json({ ok: true, time: new Date().toISOString() });
  } catch (err) {
    console.error('[cron/collect]', err);
    return NextResponse.json({ error: '수집 실패' }, { status: 500 });
  }
}
