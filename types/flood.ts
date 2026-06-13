// types/flood.ts — 침수 API 타입 정의

export interface FloodItem {
  siteCode: string;      // 관측소 코드
  siteName: string;      // 관측소명
  alertLevel3: string;   // 경계 수위
  alertLevel3Nm: string; // 경계 수위 명칭
  alertLevel4: string;   // 위험 수위
  alertLevel4Nm: string; // 위험 수위 명칭
  fludLevel: string;     // 현재 수위
  obsrTime: string;      // 관측 시각
  sttus: string;         // 상태 코드 (00:정상 01:주의 02:경계 03:위험)
  sttusNm: string;       // 상태명
  lat?: string;          // 위도 (API에 있을 경우)
  lng?: string;          // 경도 (API에 있을 경우)
}

export interface FloodApiResponse {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: {
      totalCount: string;
      pageNo: string;
      numOfRows: string;
      items: { item: FloodItem[] };
    };
  };
}

export type StatusLevel = 'normal' | 'warn' | 'danger';

export function getStatusLevel(item: FloodItem): StatusLevel {
  const level  = parseFloat(item.fludLevel)   || 0;
  const warn   = parseFloat(item.alertLevel3) || Infinity;
  const danger = parseFloat(item.alertLevel4) || Infinity;
  if (level >= danger) return 'danger';
  if (level >= warn)   return 'warn';
  return 'normal';
}
