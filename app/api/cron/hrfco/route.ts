// app/api/cron/hrfco/route.ts
// HRFCO(국가수자원관리종합정보시스템) 수위 API 프록시
// cron-job.org에서 10분마다 호출
// HRFCO list/10M.json(실시간 수위) + 로컬 info.json(정적 정보)을 합쳐 Supabase에 저장

// Vercel 환경변수 설정:
// HRFCO_API_KEY = 4451374A-3197-4E52-90A9-B283AB34DCCD

import { NextResponse } from 'next/server';
import stationInfoRaw from '@/data/hrfco-stations.json'; // ⚠️ info.json 저장 경로 - 아래 확인사항 참고

const SUPABASE_URL     = process.env.SUPABASE_URL!;
const SUPABASE_API_KEY = process.env.SUPABASE_ANON_KEY!;
const HRFCO_API_KEY    = process.env.HRFCO_API_KEY!;

// 향후 지점 추가 시 여기에만 추가하면 됨
const HRFCO_STATION_IDS = ['1018680']; // 잠수교

interface HrfcoStationInfo {
  wlobscd: string;
  agcnm:   string;
  obsnm:   string;
  addr:    string;
  etcaddr: string;
  gdt:     string;
  wrnwl:   string;
  almwl:   string;
}

// info.json이 { links: [], content: [...] } 구조라고 가정 (list/10M.json과 동일 포맷)
const stationInfoList: HrfcoStationInfo[] =
  (stationInfoRaw as any).content ?? (stationInfoRaw as any);

// ── Supabase REST API 헬퍼 (cron/collect와 동일) ──────
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

// HRFCO는 값이 없으면 공백 문자열(" ")을 줌 → null로 변환
function parseHrfcoNum(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const num = Number(trimmed);
  return Number.isNaN(num) ? null : num;
}

// "202607201740" (yyyyMMddHHmm, KST) → timestamptz용 ISO
// cron/collect의 toKstIso와 동일한 목적, HRFCO 포맷에 맞게 파싱만 다르게 처리
function ymdhmToKstIso(ymdhm: string): string | null {
  if (!ymdhm || ymdhm.length !== 12) return null;
  const y  = ymdhm.slice(0, 4);
  const mo = ymdhm.slice(4, 6);
  const d  = ymdhm.slice(6, 8);
  const h  = ymdhm.slice(8, 10);
  const mi = ymdhm.slice(10, 12);
  return `${y}-${mo}-${d}T${h}:${mi}:00+09:00`;
}

// cron/collect의 isSameObservedTime과 동일
function isSameObservedTime(a: string | null, b: string | null): boolean {
  if (a === null || b === null) return false;
  const timeA = new Date(a).getTime();
  const timeB = new Date(b).getTime();
  if (isNaN(timeA) || isNaN(timeB)) return false;
  return timeA === timeB;
}

// cron/collect의 getLastObservedAt과 동일
async function getLastObservedAt(siteCode: string): Promise<string | null> {
  const res = await supabase(
    `/water_levels?site_code=eq.${encodeURIComponent(siteCode)}&order=recorded_at.desc&limit=1`,
    { method: 'GET' }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data[0]?.observed_at ?? null;
}

async function saveLevel(
  region:      string,
  siteCode:    string,
  siteName:    string,
  waterLevel:  number,
  warnLevel:   number | null,
  dangerLevel: number | null,
  floorLevel:  number | null,
  observedAt:  string,
  source:      string,
) {
  await supabase('/water_levels', {
    method: 'POST',
    body: JSON.stringify({
      region,
      site_code:    siteCode,
      site_name:    siteName,
      water_level:  waterLevel,
      warn_level:   warnLevel,
      danger_level: dangerLevel,
      floor_level:  floorLevel,
      observed_at:  observedAt,
      source,
    }),
  });
}

// ── HRFCO 데이터 수집 ──────────────────────────────────
async function collectHrfco() {
  // ⚠️ URL 형식 가정 - 실제 발급받은 엔드포인트 URL로 교체 필요 (아래 확인사항 참고)
  const url = `https://api.hrfco.go.kr/${HRFCO_API_KEY}/waterlevel/list/10M.json`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return;

  const data = await res.json();
  const rows = data?.content ?? [];

  for (const row of rows) {
    const { wlobscd, ymdhm, wl } = row;
    if (!HRFCO_STATION_IDS.includes(wlobscd)) continue; // 관심 지점만 처리

    const level = parseHrfcoNum(wl);
    if (level === null) continue;

    const observedAt = ymdhmToKstIso(ymdhm);
    if (observedAt === null) continue;

    const info = stationInfoList.find((s) => s.wlobscd === wlobscd);
    if (!info) continue; // 로컬 info.json에 해당 지점 없으면 스킵

    // 이전 관측시간과 동일하면 저장 안 함
    const lastObservedAt = await getLastObservedAt(wlobscd);
    if (lastObservedAt === null || !isSameObservedTime(observedAt, lastObservedAt)) {
      await saveLevel(
        `${info.addr}${info.etcaddr?.trim() ?? ''}`, // ⚠️ region 필드 - 아래 확인사항 참고
        wlobscd,
        info.obsnm,
        level,
        parseHrfcoNum(info.wrnwl),
        parseHrfcoNum(info.almwl),
        parseHrfcoNum(info.gdt),
        observedAt,
        info.agcnm,
      );
    }
  }
}

// ── 메인 핸들러 ───────────────────────────────────────
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization') ??
                     request.headers.get('Authorization');
  const secret   = process.env.CRON_SECRET?.trim();
  const incoming = authHeader?.replace('Bearer ', '').trim();

  if (!secret || incoming !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await collectHrfco();
    return NextResponse.json({ ok: true, time: new Date().toISOString() });
  } catch (err) {
    console.error('[cron/hrfco]', err);
    return NextResponse.json({ error: '수집 실패' }, { status: 500 });
  }
}

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

// import { NextResponse } from 'next/server';

// const BASE = 'https://api.hrfco.go.kr';
// const RESPONSE_KEY_CANDIDATES = ['content', 'list', 'result'];

// function extractRows(data: unknown): Record<string, unknown>[] {
//   if (Array.isArray(data)) return data as Record<string, unknown>[];
//   if (data && typeof data === 'object') {
//     for (const key of RESPONSE_KEY_CANDIDATES) {
//       const val = (data as Record<string, unknown>)[key];
//       if (Array.isArray(val)) return val as Record<string, unknown>[];
//     }
//   }
//   return [];
// }

// export async function GET(request: Request) {
//   const apiKey = process.env.HRFCO_API_KEY;

//   if (!apiKey) {
//     return NextResponse.json(
//       { error: 'HRFCO_API_KEY 환경변수가 설정되지 않았습니다.' },
//       { status: 500 }
//     );
//   }

//   const { searchParams } = new URL(request.url);
//   const type = searchParams.get('type'); // 'info' | 'realtime'
//   const code = searchParams.get('code'); // wlobscd (없으면 전체 반환)

//   if (type !== 'info' && type !== 'realtime') {
//     return NextResponse.json(
//       { error: "type 파라미터는 'info' 또는 'realtime'이어야 합니다." },
//       { status: 400 }
//     );
//   }

//   const upstreamUrl =
//     type === 'info'
//       ? `${BASE}/${apiKey}/waterlevel/info.json`
//       : `${BASE}/${apiKey}/waterlevel/list/10M.json`;

//   try {
//     const upstream = await fetch(upstreamUrl, { next: { revalidate: 60 } });

//     if (!upstream.ok) {
//       return NextResponse.json(
//         { error: `HRFCO API 호출 실패: ${upstream.status}` },
//         { status: upstream.status }
//       );
//     }

//     const data = await upstream.json();
//     const rows = extractRows(data);
//     const filtered = code ? rows.filter((r) => r.wlobscd === code) : rows;

//     return NextResponse.json({ content: filtered });
//   } catch (err) {
//     console.error('[/api/hrfco] 오류:', err);
//     return NextResponse.json({ error: '서버 오류' }, { status: 500 });
//   }
// }
