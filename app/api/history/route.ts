// app/api/history/route.ts
// 과거 수위 데이터 조회
// 사용: /api/history?site=1401&region=seoul&from=2026-07-01T00:00:00&to=2026-07-07T23:59:59

import { NextResponse } from 'next/server';

const SUPABASE_URL     = process.env.SUPABASE_URL!;
const SUPABASE_API_KEY = process.env.SUPABASE_ANON_KEY!;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const site   = searchParams.get('site');
  const region = searchParams.get('region');
  const from   = searchParams.get('from');
  const to     = searchParams.get('to');

  if (!site || !region) {
    return NextResponse.json({ error: 'site, region 파라미터 필요' }, { status: 400 });
  }

  let query = `/water_levels?site_code=eq.${encodeURIComponent(site)}&region=eq.${region}&order=recorded_at.asc`;
  if (from) query += `&recorded_at=gte.${encodeURIComponent(from)}`;
  if (to)   query += `&recorded_at=lte.${encodeURIComponent(to)}`;

  const res = await fetch(`${SUPABASE_URL}/rest/v1${query}`, {
    headers: {
      'apikey': SUPABASE_API_KEY,
      'Authorization': `Bearer ${SUPABASE_API_KEY}`,
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: '조회 실패' }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
