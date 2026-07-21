// app/api/seoul/route.ts
// 서울 하천 수위 API 프록시
//
// Vercel 환경변수 설정:
//   SEOUL_API_KEY = 546373577a6e696336347643425578
//   SEOUL_API_URL = http://openapi.seoul.go.kr:8088
//
// 서울 하천 수위 - Supabase에서 site_code별 최신 데이터만 조회해서 반환
// 더 이상 서울 열린데이터광장 API를 직접 호출하지 않음. 실시간 수집은 /api/cron/collect가 담당

import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

export async function GET() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: 'Supabase 환경변수가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  try {
    // 최근 3시간치만 가져와서(사이트당 10분 간격 * 약 50개 지점 기준 넉넉한 범위)
    // recorded_at 최신순 정렬 후 site_code별 첫 번째(=최신) 행만 남긴다.
    // PostgREST는 DISTINCT ON을 지원하지 않아 앱단에서 dedupe.
    const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const query =
      `region=like.${encodeURIComponent('서울*')}` +
      `&recorded_at=gte.${encodeURIComponent(cutoff)}` +
      `&order=recorded_at.desc&limit=1000`;

    const upstream = await fetch(`${SUPABASE_URL}/rest/v1/water_levels?${query}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      next: { revalidate: 30 },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Supabase 조회 실패: ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const rows: Array<Record<string, unknown>> = await upstream.json();

    const latestBySite = new Map<string, Record<string, unknown>>();
    for (const row of rows) {
      const siteCode = String(row.site_code ?? '');
      if (siteCode && !latestBySite.has(siteCode)) {
        latestBySite.set(siteCode, row);
      }
    }

    return NextResponse.json({ rows: Array.from(latestBySite.values()) });
  } catch (err) {
    console.error('[/api/seoul] 오류:', err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// import { NextResponse } from 'next/server';

// export async function GET() {
//   const apiKey = process.env.SEOUL_API_KEY;
//   const apiUrl = process.env.SEOUL_API_URL;

//   if (!apiKey || !apiUrl) {
//     return NextResponse.json(
//       { error: 'API 환경변수가 설정되지 않았습니다.' },
//       { status: 500 }
//     );
//   }

//   try {
//     const upstream = await fetch(
//       `${apiUrl}/${apiKey}/json/ListRiverStageService/1/50`,
//       { next: { revalidate: 60 } }
//     );

//     if (!upstream.ok) {
//       return NextResponse.json(
//         { error: `서울 API 호출 실패: ${upstream.status}` },
//         { status: upstream.status }
//       );
//     }

//     const data = await upstream.json();
//     return NextResponse.json(data);

//   } catch (err) {
//     console.error('[/api/seoul] 오류:', err);
//     return NextResponse.json({ error: '서버 오류' }, { status: 500 });
//   }
// }
