// app/api/seoul/route.ts
// 서울 하천 수위 API 프록시
//
// Vercel 환경변수 설정:
//   SEOUL_API_KEY = 546373577a6e696336347643425578
//   SEOUL_API_URL = http://openapi.seoul.go.kr:8088

import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.SEOUL_API_KEY;
  const apiUrl = process.env.SEOUL_API_URL;

  if (!apiKey || !apiUrl) {
    return NextResponse.json(
      { error: 'API 환경변수가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  try {
    const upstream = await fetch(
      `${apiUrl}/${apiKey}/json/ListRiverStageService/1/50`,
      { next: { revalidate: 60 } }
    );

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `서울 API 호출 실패: ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data);

  } catch (err) {
    console.error('[/api/seoul] 오류:', err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
