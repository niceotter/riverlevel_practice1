// app/api/cron/collect/route.ts
// Vercel Cron Job - 10분마다 실행
// 서울/부산 API 데이터를 수집해서 Supabase에 저장

import { NextResponse } from 'next/server';

const SUPABASE_URL     = process.env.SUPABASE_URL!;
const SUPABASE_API_KEY = process.env.SUPABASE_ANON_KEY!;

// Supabase REST API 호출 헬퍼
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

// 가장 최근 저장된 수위 조회
async function getLastLevel(siteCode: string): Promise<number | null> {
  const res = await supabase(
    `/water_levels?site_code=eq.${encodeURIComponent(siteCode)}&order=recorded_at.desc&limit=1`,
    { method: 'GET' }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data[0]?.water_level ?? null;
}

// 수위 저장
async function saveLevel(region: string, siteCode: string, waterLevel: number) {
  await supabase('/water_levels', {
    method: 'POST',
    body: JSON.stringify({ region, site_code: siteCode, water_level: waterLevel }),
  });
}

// 서울 데이터 수집
async function collectSeoul() {
  const apiKey = process.env.SEOUL_API_KEY!;
  const apiUrl = process.env.SEOUL_API_URL!;
  const res = await fetch(`${apiUrl}/${apiKey}/json/ListRiverStageService/1/50`);
  if (!res.ok) return;
  const data = await res.json();
  const rows = data?.ListRiverStageService?.row ?? [];

  for (const row of rows) {
    const level = parseFloat(row.RLTM_RVR_WATL_CNT);
    if (isNaN(level)) continue;
    const last = await getLastLevel(row.WATG_CD);
    if (last === null || last !== level) {
      await saveLevel('seoul', row.WATG_CD, level);
    }
  }
}

// 부산 데이터 수집
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
    const level = parseFloat(item.waterLevel);
    if (isNaN(level)) continue;
    const last = await getLastLevel(item.siteCode);
    if (last === null || last !== level) {
      await saveLevel('busan', item.siteCode, level);
    }
  }
}

export async function GET(request: Request) {
  // Cron Job 인증 (Vercel이 자동으로 헤더 추가)
//  const authHeader = request.headers.get('authorization');
//  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
//    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//  }

  try {
    await Promise.all([collectSeoul(), collectBusan()]);
    return NextResponse.json({ ok: true, time: new Date().toISOString() });
  } catch (err) {
    console.error('[cron/collect]', err);
    return NextResponse.json({ error: '수집 실패' }, { status: 500 });
  }
}
