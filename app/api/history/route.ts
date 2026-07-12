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


  // observed_at(실제 관측 시각) 기준으로 필터링.
  // 그래프에 표시되는 값도 observed_at이므로 검색 기준과 표시 기준을 통일했다.
  // 프론트엔드의 <input type="datetime-local">은 한국 로컬시간 문자열
  // ("2026-07-01T00:00:00")을 시간대 정보 없이 보내는데,
  // observed_at은 timestamptz라서 "+09:00"을 붙여 한국시간임을 명시해야
  // DB가 UTC로 오해하지 않는다.
  const toKstIso = (v: string | null) => (v ? `${v}+09:00` : null);


  let query = `/water_levels?site_code=eq.${encodeURIComponent(site)}&region=eq.${region}&order=recorded_at.asc`;
  if (from) query += `&observed_at=gte.${encodeURIComponent(toKstIso(from)!)}`;
  if (to)   query += `&observed_at=lte.${encodeURIComponent(toKstIso(to)!)}`;


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
