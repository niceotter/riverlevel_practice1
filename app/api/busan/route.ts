// app/api/busan/route.ts
// 부산 하천 수위 API 프록시
//
// Vercel 환경변수 설정:
//   BUSAN_API_KEY = 918f4ebbbaab3ed43ddb9f0e97a8a7ed1fd3945da2326b1137e932c075b704be
//   BUSAN_API_URL = https://apis.data.go.kr/6260000/BusanRvrwtLevelInfoService/getRvrwtLevelInfo
//
// 부산 하천 수위 - Supabase에서 site_code별 최신 데이터만 조회해서 반환
// 더 이상 공공데이터포털 API를 직접 호출하지 않음. 실시간 수집은 /api/cron/collect가 담당

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
      `region=eq.${encodeURIComponent('부산광역시')}` +
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
    console.error('[/api/busan] 오류:', err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// import { NextResponse } from 'next/server';

// export async function GET(request: Request) {
//   const apiKey = process.env.BUSAN_API_KEY;
//   const apiUrl = process.env.BUSAN_API_URL;

//   if (!apiKey || !apiUrl) {
//     return NextResponse.json(
//       { error: 'API 환경변수가 설정되지 않았습니다.' },
//       { status: 500 }
//     );
//   }

//   try {
//     const { searchParams } = new URL(request.url);
//     const params = new URLSearchParams(searchParams);
//     params.set('serviceKey', apiKey);
//     params.set('resultType', 'json');
//     params.set('pageNo', '1');
//     params.set('numOfRows', '30');

//     const upstream = await fetch(`${apiUrl}?${params.toString()}`, {
//       next: { revalidate: 60 },
//     });

//     if (!upstream.ok) {
//       return NextResponse.json(
//         { error: `부산 API 호출 실패: ${upstream.status}` },
//         { status: upstream.status }
//       );
//     }

//     const data = await upstream.json();
//     return NextResponse.json(data);

//   } catch (err) {
//     console.error('[/api/busan] 오류:', err);
//     return NextResponse.json({ error: '서버 오류' }, { status: 500 });
//   }
// }