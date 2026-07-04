// app/api/seoul/route.ts
// 서울 열린데이터광장 하천 수위 API 프록시
// http only라 브라우저에서 직접 호출 불가 → Vercel 서버리스에서 호출

import { NextResponse } from 'next/server';

const SEOUL_API_URL = 'http://openapi.seoul.go.kr:8088/546373577a6e696336347643425578/json/ListRiverStageService/1/50';

export async function GET() {
  try {
    const upstream = await fetch(SEOUL_API_URL, {
      next: { revalidate: 60 }, // 60초 캐시
    });

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
