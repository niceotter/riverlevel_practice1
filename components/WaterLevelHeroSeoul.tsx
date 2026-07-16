'use client';
// components/WaterLevelHeroSeoul.tsx
//
// 사다리꼴 버전 WaterAnimationSeoul.tsx의 데이터 fetch/팝업 로직은 그대로 두고,
// 화면 디자인만 새 버전(사이드바/사다리꼴 없이, 바닥=0m 보정된 세로 눈금자 +
// 수위에 따라 위치가 바뀌는 물)으로 교체한 자체완결형 컴포넌트.
// /api/seoul을 60초마다 폴링. Supabase 사용 안 함.
//
// ── HRFCO 지점(예: 잠수교) 지원 추가 ──────────────────────────────
// id가 HRFCO_STATION_IDS에 포함되면 서울시 API 대신 /api/hrfco를 폴링한다.
// 서울시 API(WATG_CD 체계)와 HRFCO API(wlobscd 체계)는 필드가 완전히 달라서,
// load() 안에서 각각 원본 데이터를 받아 공통 DisplayModel로 정규화한 뒤
// 렌더링 로직은 하나만 쓰도록 만들었다.

import { useEffect, useRef, useState } from 'react';

interface SeoulStation {
  WATG_CD: string;
  WATG_NM: string;
  RVR_NM: string;
  DTRSM_DATA_CLCT_TM: string;
  RLTM_RVR_WATL_CNT: number;
  PLAN_FLDE: number;
  RBH: number;
  CNTRL_WATL: number;
}

interface HrfcoInfo {
  wlobscd: string;
  obsnm: string;
  addr: string;
  etcaddr: string;
  gdt: string;
  attwl: string;
  wrnwl: string;
  almwl: string;
  srswl: string;
  pfh: string;
}

interface HrfcoRealtime {
  wlobscd: string;
  ymdhm: string; // yyyyMMddHHmm
  wl: string;
  fw: string;
}

interface ModelTick {
  key: string;
  label: string;
  valueRaw: number; // 보정 전(raw) 값
  color: string;
  right: number;
  bottom: number;
}

interface RenderTick {
  key: string;
  label: string;
  value: number; // 바닥(floorLevel) 보정된 값
  color: string;
  right: number;
  bottom: number;
}

// 표시 로직 전체가 이 구조 하나만 보고 동작하도록 정규화한 모델.
// 서울시 API든 HRFCO API든 load() 단계에서 이 모양으로 변환한다.
interface DisplayModel {
  title: string; // "서울 탄천 여수대교" 같은 타이틀
  measuredAt: string;
  source: string;
  floorLevel: number; // raw 값 기준 바닥(0m) 보정 기준값
  currentLevelRaw: number; // 보정 전 현재 수위
  scaleMaxRaw: number; // 보정 전 눈금자 최상단 값
  ticks: ModelTick[];
  alertDangerRaw: number | null; // 위험 알림 팝업 트리거 기준(raw)
  alertWarnRaw: number | null; // 경고 알림 팝업 트리거 기준(raw)
}

interface Props {
  id: string; // WATG_CD 또는 HRFCO wlobscd
  externalLink?: string; // 없으면 "CCTV 링크없음" 팝업
}

const TOP_PADDING = 14;
const BOTTOM_PADDING = 6;
const WATER_TOP_COLOR = '#6fb4f0'; // Header 물결 패턴과 맞춘 색

// HRFCO API로 관리하는 지점 목록 (wlobscd 기준)
const HRFCO_STATION_IDS = new Set<string>([
  '1018680', // 서울시(잠수교)
]);

// HRFCO 응답의 숫자 필드는 값이 없을 때 " "(공백 문자열)로 온다.
// trim 없이 Number()를 쓰면 " " → 0으로 잘못 변환되므로 반드시 이 헬퍼를 거친다.
function parseHrfcoNum(v: string | undefined | null): number | null {
  if (v === undefined || v === null) return null;
  const trimmed = v.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function parseHrfcoYmdhm(ymdhm: string): string {
  if (!ymdhm || ymdhm.length < 12) return ymdhm;
  const y = ymdhm.slice(0, 4);
  const mo = ymdhm.slice(4, 6);
  const d = ymdhm.slice(6, 8);
  const h = ymdhm.slice(8, 10);
  const mi = ymdhm.slice(10, 12);
  return `${y}-${mo}-${d} ${h}:${mi}`;
}

export default function WaterLevelHeroSeoul({ id, externalLink }: Props) {
  const isHrfco = HRFCO_STATION_IDS.has(id);

  const [model, setModel] = useState<DisplayModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const [showNoLink, setShowNoLink] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const alertShown = useRef({ warn: false, danger: false });

  const loadSeoul = async () => {
    const r = await fetch('/api/seoul');
    if (!r.ok) throw new Error();
    const data = await r.json();
    const rows: SeoulStation[] = data?.ListRiverStageService?.row ?? [];
    const found = rows.find((r2) => r2.WATG_CD === id);
    if (!found) throw new Error();

    const showWarn = found.CNTRL_WATL > found.RBH;

    const next: DisplayModel = {
      title: `서울 ${found.RVR_NM.trim()} ${found.WATG_NM}`,
      measuredAt: found.DTRSM_DATA_CLCT_TM,
      source: '데이터 제공 : 서울특별시 물순환안전국',
      floorLevel: found.RBH,
      currentLevelRaw: found.RLTM_RVR_WATL_CNT,
      scaleMaxRaw: found.RBH + (found.PLAN_FLDE - found.RBH) * 1.18,
      alertDangerRaw: found.PLAN_FLDE,
      alertWarnRaw: showWarn ? found.CNTRL_WATL : null,
      ticks: [
        { key: 'danger', label: `위험 수위\n${(found.PLAN_FLDE - found.RBH).toFixed(1)}m`, valueRaw: found.PLAN_FLDE, color: '#e02424', right: 26, bottom: -6 },
        ...(showWarn
          ? [{ key: 'warn', label: `경고 수위\n${(found.CNTRL_WATL - found.RBH).toFixed(1)}m`, valueRaw: found.CNTRL_WATL, color: '#f5820a', right: 26, bottom: -6 }]
          : []),
        { key: 'floor', label: '바닥 0.0m', valueRaw: found.RBH, color: '#000000', right: 26, bottom: -14 },
      ],
    };
    setModel(next);
  };

  const loadHrfco = async () => {
    const [infoRes, rtRes] = await Promise.all([
      fetch(`/api/hrfco?type=info&code=${id}`),
      fetch(`/api/hrfco?type=realtime&code=${id}`),
    ]);
    if (!infoRes.ok || !rtRes.ok) throw new Error();

    const infoData = await infoRes.json();
    const rtData = await rtRes.json();
    const info: HrfcoInfo | undefined = infoData?.content?.[0];
    const rt: HrfcoRealtime | undefined = rtData?.content?.[0];
    if (!info || !rt) throw new Error();

    // HRFCO 응답은 값이 없는 필드를 ""가 아니라 " "(공백)로 준다.
    // Number(" ")는 NaN이 아니라 0을 반환하므로 반드시 trim 후 빈 문자열 체크가 필요하다.
    const gdt = parseHrfcoNum(info.gdt);
    const attwl = parseHrfcoNum(info.attwl);
    const wrnwl = parseHrfcoNum(info.wrnwl);
    const almwl = parseHrfcoNum(info.almwl);
    const srswl = parseHrfcoNum(info.srswl);
    const pfh = parseHrfcoNum(info.pfh);
    const wl = parseHrfcoNum(rt.wl);

    // 바닥(gdt)과 현재수위(wl)는 필수값 — 없으면 표시 자체가 불가능
    if (gdt === null || wl === null) throw new Error();

    // 눈금자 최상단: pfh(계획홍수위) 우선, 없으면 있는 값 중 가장 높은 단계로 대체.
    // 전부 없으면(예: 경보수위 미설정 지점) 현재수위 기준으로 여유 있게 잡는다.
    const scaleMaxRaw = pfh ?? srswl ?? almwl ?? wrnwl ?? attwl ?? gdt + Math.max(wl - gdt, 1) * 1.5;

    const tickDefs: { key: string; label: string; valueRaw: number | null; color: string }[] = [
      { key: 'pfh', label: '계획홍수위', valueRaw: pfh, color: '#7a0e0e' },
      { key: 'srswl', label: '심각 수위', valueRaw: srswl, color: '#e02424' },
      { key: 'almwl', label: '경보 수위', valueRaw: almwl, color: '#e05d24' },
      { key: 'wrnwl', label: '주의보 수위', valueRaw: wrnwl, color: '#f5820a' },
      { key: 'attwl', label: '관심 수위', valueRaw: attwl, color: '#2f7fd6' },
    ];

    // 바닥 기준: gdt (영점표고) / 눈금자 최상단: pfh (계획홍수위) — 사용자 확정
    const next: DisplayModel = {
      title: `서울 ${info.obsnm}`,
      measuredAt: parseHrfcoYmdhm(rt.ymdhm),
      source: '데이터 제공 : 기후에너지환경부(HRFCO)',
      floorLevel: gdt,
      currentLevelRaw: wl,
      scaleMaxRaw,
      // 알림 팝업 기준: 심각(srswl)=위험, 경보(almwl)=경고로 매핑, 값 없으면 다음 단계로 대체.
      // ※ 4단계(관심/주의보/경보/심각) 중 임의로 매핑한 값이라 필요시 조정해주세요.
      alertDangerRaw: srswl ?? pfh ?? null,
      alertWarnRaw: almwl ?? wrnwl ?? null,
      ticks: [
        // 값이 공백이었던 단계(예: 태백시(무사교))는 눈금에서 자동으로 제외
        ...tickDefs
          .filter((t): t is { key: string; label: string; valueRaw: number; color: string } => t.valueRaw !== null)
          .map((t) => ({
            key: t.key,
            label: `${t.label}\n${(t.valueRaw - gdt).toFixed(1)}m`,
            valueRaw: t.valueRaw,
            color: t.color,
            right: 26,
            bottom: -6,
          })),
        { key: 'floor', label: '바닥 0.0m', valueRaw: gdt, color: '#000000', right: 26, bottom: -14 },
      ],
    };
    setModel(next);
  };

  const load = () => {
    setError(false);
    const task = isHrfco ? loadHrfco() : loadSeoul();
    task
      .then(() => setLoading(false))
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 경고/위험 알림 팝업 (model이 갱신될 때마다 체크)
  useEffect(() => {
    if (!model) return;
    const current = model.currentLevelRaw;
    if (model.alertDangerRaw !== null && current >= model.alertDangerRaw && !alertShown.current.danger) {
      alertShown.current.danger = true;
      setAlertMsg(`⚠️ 위험수위 초과! 현재 ${(current - model.floorLevel).toFixed(2)}m`);
    } else if (
      model.alertWarnRaw !== null &&
      current >= model.alertWarnRaw &&
      !alertShown.current.warn
    ) {
      alertShown.current.warn = true;
      setAlertMsg(`⚠️ 경고수위 초과! 현재 ${(current - model.floorLevel).toFixed(2)}m`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  if (loading) return <p style={{ padding: '2rem', color: '#888' }}>데이터 불러오는 중…</p>;
  if (error || !model) return <p style={{ padding: '2rem', color: '#ef4444' }}>데이터를 불러올 수 없습니다.</p>;

  // ── 바닥(floorLevel) 기준 보정: 모든 값에서 floorLevel을 빼서 바닥=0m로 통일 ──
  const floorLevel = model.floorLevel;
  const calibratedCurrent = model.currentLevelRaw - floorLevel;
  const scaleMin = 0;
  const scaleMax = model.scaleMaxRaw - floorLevel;

  const levelToTopPercent = (value: number) => {
    const clamped = Math.min(Math.max(value, scaleMin), scaleMax);
    const ratio = (clamped - scaleMin) / (scaleMax - scaleMin);
    const usable = 100 - TOP_PADDING - BOTTOM_PADDING;
    return TOP_PADDING + (1 - ratio) * usable;
  };

  const waterTopPercent = levelToTopPercent(calibratedCurrent);

  const ticks: RenderTick[] = [
    { key: 'current', label: `현재 수위 ${calibratedCurrent.toFixed(1)}m`, value: calibratedCurrent, color: '#1e00ff', right: 70, bottom: 10 },
    ...model.ticks.map((t) => ({ key: t.key, label: t.label, value: t.valueRaw - floorLevel, color: t.color, right: t.right, bottom: t.bottom })),
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: 'var(--bg-sky)' }}>
      {/* 왼쪽 상단: 타이틀 + 정보 + 버튼 */}
      <div style={{ position: 'absolute', top: '6vh', left: '5vw', zIndex: 10, maxWidth: 480 }}>
        <h3 style={{ fontSize: 'clamp(15px, 4vw, 20px)', fontWeight: 600, lineHeight: 1.25, color: '#000000', margin: '0 0 28px 0' }}>
          <a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            🔙 메인으로 돌아가기
          </a>
        </h3>

        <p style={{ 
          fontSize: 'clamp(20px, 2.4vw, 26px)',
          fontWeight: 700, 
          margin: '0 0 6px 0' 
        }}>
          {model.title}
        </p>

        <p style={{ 
          fontSize: 16, 
          fontWeight: 600, 
          margin: '0 0 8px 0' 
        }}>
          {model.measuredAt}
        </p>

        <p style={{ fontSize: 13, color: '#6b6b6b', fontWeight: 600, margin: '0 0 12px 0' }}>{model.source}</p>

        <div style={{ display: 'flex', gap: 10, margin: '10px 0 18px 0' }}>
          <button
            type="button"
            onClick={() => setShowPhoto(true)}
            style={{ minWidth: 120, borderRadius: 10, border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', textAlign: 'left', padding: '14px 16px', backgroundColor: '#555' }}
          >
            <span style={{ fontWeight: 700 }}>📷 수위계 사진</span>
            <span style={{ display: 'block', marginTop: 6, color: '#d8d8d8', fontSize: 12 }}>수위계 사진 확보에 노력 중입니다.</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, margin: '10px 0 18px 0' }}>
          <button
            type="button"
            onClick={() => (externalLink ? window.open(externalLink, '_blank') : setShowNoLink(true))}
            style={{ 
              minWidth: 120, 
              borderRadius: 10, 
              border: 'none', 
              color: '#fff', 
              fontSize: 14, 
              lineHeight: 1.4, 
              cursor: 'pointer', 
              textAlign: 'left', 
              padding: '14px 16px', 
              backgroundColor: '#555' 
            }}
          >
            <span style={{ fontWeight: 700 }}>
              📹 CCTV 링크
            </span>
            <span style={{ 
              display: 'block', 
              marginTop: 6, 
              color: '#d8d8d8', 
              fontSize: 12 
            }}>
              <>CCTV가 없거나<br/>다른 곳을 바라보고 있을 수 있습니다</>
            </span>
          </button>
        </div>

      </div>

      {/* 왼쪽 하단: 목록으로 / 새로고침 */}
      <div style={{ position: 'absolute', left: '5vw', bottom: '5vh', zIndex: 10, display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={load}
          style={{
            background: '#fff',
            border: '1.5px solid #d8d8d8',
            borderRadius: 999,
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer'
          }}>
          ↻ 새로고침
        </button>
      </div>

      {/* 오른쪽 세로 눈금자 */}
      <div style={{
        position: 'absolute', 
        right: '6vw', 
        top: 0, 
        height: '100%', 
        width: 220, 
        zIndex: 10 
      }}>
        <div style={{ 
          position: 'absolute', 
          right: 0, 
          top: 0, 
          bottom: 0, 
          width: 2, 
          background: '#cfcfcf'
         }} />
        {ticks.map((t) => {
          const top = levelToTopPercent(t.value);
          const isCurrent = t.key === 'current';
          return (
            <div key={t.key} style={{ 
              position: 'absolute', 
              right: -2, 
              top: `${top}%`, 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-end', 
              transform: 'translateY(-50%)' 
            }}>
              <span style={{ 
                position: 'absolute', 
                right: t.right, 
                bottom: t.bottom,
                whiteSpace: 'pre-line', 
                fontWeight: 800, 
                fontSize: isCurrent ? 18 : t.key === 'floor' ? 15 : 18, 
                color: t.color 
              }}>
                {t.label}
              </span>
              <span style={{ 
                width: isCurrent ? 26 : 18, 
                height: isCurrent ? 3 : 2, 
                background: t.color 
              }} />
            </div>
          );
        })}
      </div>

      {/* 물 */}
      <div style={{
        position: 'absolute',
        left: 0, 
        right: 0, 
        bottom: 0, 
        top: `${waterTopPercent}%`, 
        background: 'linear-gradient(180deg, var(--bg-water) 0%, #2f7fd6 100%)', 
        zIndex: 1, 
        transition: 'top 0.6s ease-out' }} />

      {/* 물결 라인 - Header와 동일한 패턴 */}
      <div
        style={{
          position: 'absolute', left: 0, right: 0, top: `calc(${waterTopPercent}% - 10px)`, height: '10px', zIndex: 2,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='10'%3E%3Cpath d='M0 10 Q9 9 10 0 Q11 9 20 10' stroke='${encodeURIComponent(WATER_TOP_COLOR)}' fill='${encodeURIComponent(WATER_TOP_COLOR)}' stroke-width='2'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat-x', transition: 'top 0.6s ease-out',
        }}
      />

      {/* 경고/위험 알림 팝업 */}
      {alertMsg && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setAlertMsg(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '2rem 2.5rem', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', maxWidth: 360 }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444', marginBottom: '1rem' }}>{alertMsg}</p>
            <button onClick={() => setAlertMsg(null)} style={{ padding: '0.5rem 1.5rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.9rem' }}>확인</button>
          </div>
        </div>
      )}

      {/* 수위계 사진 팝업 */}
      {showPhoto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowPhoto(false)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '1rem', maxWidth: '90vw', maxHeight: '80vh' }} onClick={(e) => e.stopPropagation()}>
            <img
              src={`/images/${id}.jpg`}
              alt={`${id} 수위계`}
              style={{ maxWidth: '100%', maxHeight: '70vh', display: 'block' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).alt = '사진 없음'; }}
            />
            <button onClick={() => setShowPhoto(false)} style={{ marginTop: '0.75rem', width: '100%', padding: '0.5rem', background: '#555', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>닫기</button>
          </div>
        </div>
      )}

      {/* CCTV 링크없음 팝업 */}
      {showNoLink && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowNoLink(false)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', maxWidth: '90vw', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <p style={{ fontSize: '1rem', color: '#555', marginBottom: '1rem' }}>본 수위계는 연결된 CCTV가 없습니다.</p>
            <button onClick={() => setShowNoLink(false)} style={{ padding: '0.5rem 1.5rem', background: '#555', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}