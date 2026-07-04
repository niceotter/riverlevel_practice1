// app/api/busan/route.ts
// 부산 하천 수위 API 프록시
//
// Vercel 환경변수 설정:
//   BUSAN_API_KEY = 918f4ebbbaab3ed43ddb9f0e97a8a7ed1fd3945da2326b1137e932c075b704be
//   BUSAN_API_URL = https://apis.data.go.kr/6260000/BusanRvrwtLevelInfoService/getRvrwtLevelInfo

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const apiKey = process.env.BUSAN_API_KEY;
  const apiUrl = process.env.BUSAN_API_URL;

  if (!apiKey || !apiUrl) {
    return NextResponse.json(
      { error: 'API 환경변수가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams(searchParams);
    params.set('serviceKey', apiKey);
    params.set('resultType', 'json');
    params.set('pageNo', '1');
    params.set('numOfRows', '30');

    const upstream = await fetch(`${apiUrl}?${params.toString()}`, {
      next: { revalidate: 60 },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `부산 API 호출 실패: ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data);

  } catch (err) {
    console.error('[/api/busan] 오류:', err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}