// app/api/hrfco/route.ts
// HRFCO(국가수자원관리종합정보시스템) 수위 API 프록시
//
// Vercel 환경변수 설정:
//   HRFCO_API_KEY = 4451374A-3197-4E52-90A9-B283AB34DCCD
//
// 사용법:
//   GET /api/hrfco?type=info&code=1018680      → 관측소 기본정보(1개)
//   GET /api/hrfco?type=realtime&code=1018680  → 실시간 수위(1개, 최신 10분값)
//   code를 생략하면 전국 전체 목록을 반환 (추후 확장용, 지금은 사용 안 함)
//
// ⚠️ 확인 필요: HRFCO 응답의 최상위 래퍼 키를 실제로 확인 못했습니다(robots.txt 차단으로
// 직접 fetch 불가). 아래 코드는 "content" 키를 우선 시도하고, 없으면 배열 자체를
// 그대로 쓰는 걸로 fallback 처리했습니다. 배포 후 Vercel 로그에서 실제 구조를 확인하고
// 필요하면 RESPONSE_KEY_CANDIDATES 배열을 조정해주세요.

import { NextResponse } from 'next/server';

const BASE = 'https://api.hrfco.go.kr';
const RESPONSE_KEY_CANDIDATES = ['content', 'list', 'result'];

function extractRows(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === 'object') {
    for (const key of RESPONSE_KEY_CANDIDATES) {
      const val = (data as Record<string, unknown>)[key];
      if (Array.isArray(val)) return val as Record<string, unknown>[];
    }
  }
  return [];
}

export async function GET(request: Request) {
  const apiKey = process.env.HRFCO_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'HRFCO_API_KEY 환경변수가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'info' | 'realtime'
  const code = searchParams.get('code'); // wlobscd (없으면 전체 반환)

  if (type !== 'info' && type !== 'realtime') {
    return NextResponse.json(
      { error: "type 파라미터는 'info' 또는 'realtime'이어야 합니다." },
      { status: 400 }
    );
  }

  const upstreamUrl =
    type === 'info'
      ? `${BASE}/${apiKey}/waterlevel/info.json`
      : `${BASE}/${apiKey}/waterlevel/list/10M.json`;

  try {
    const upstream = await fetch(upstreamUrl, { next: { revalidate: 60 } });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `HRFCO API 호출 실패: ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();
    const rows = extractRows(data);
    const filtered = code ? rows.filter((r) => r.wlobscd === code) : rows;

    return NextResponse.json({ content: filtered });
  } catch (err) {
    console.error('[/api/hrfco] 오류:', err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
