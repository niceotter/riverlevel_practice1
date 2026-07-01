// app/api/flood/route.ts
// 공공API 프록시 — 브라우저에 API 키를 노출하지 않습니다.
//
// Vercel 환경변수 설정 (대시보드 > Settings > Environment Variables):
//   FLOOD_API_KEY = 발급받은_인증키
//   FLOOD_API_URL = https://공공api주소/경로  (키 제외한 base URL)

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const apiKey = process.env.FLOOD_API_KEY;
  const apiUrl = process.env.FLOOD_API_URL;

  if (!apiKey || !apiUrl) {
    return NextResponse.json(
      { error: 'API 환경변수가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  try {
    // 클라이언트 쿼리 파라미터를 그대로 전달 (페이지네이션 등)
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams(searchParams);
    params.set('serviceKey', apiKey);
//    params.set('type', 'json');
    params.set('resultType', 'json');
    params.set('pageNo', '1');
    params.set('numOfRows', '30');

    const upstream = await fetch(`${apiUrl}?${params.toString()}`, {
      next: { revalidate: 60 }, // 60초 캐시 (너무 자주 호출 방지)
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `공공API 호출 실패: ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data);

  } catch (err) {
    console.error('[/api/flood] 오류:', err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
