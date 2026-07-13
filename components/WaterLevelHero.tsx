'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * WaterLevelHero
 * -----------------------------------------------------------------------
 * /seoul/[id], /busan/[id] sub-directory 페이지의 메인 비주얼 + 팝업.
 * 데이터는 이 컴포넌트가 직접 fetch하지 않고, 상위 페이지(app/seoul/[id]/page.tsx
 * 등)에서 60초 폴링으로 받아온 값을 props로 내려받아 그리기만 한다.
 *
 * 레이아웃: 왼쪽 상단(타이틀/지점명/시간/버튼/출처), 왼쪽 하단(목록/새로고침),
 * 오른쪽(세로 눈금자), 배경(수위에 따라 위치가 바뀌는 물 + Header 물결 패턴).
 *
 * ★ 바닥 높이 보정(calibration) ★
 * 서울은 floorLevel(RBH)이 실제 값(예: 7.59m)이라 0이 아니고,
 * 부산은 floorLevel이 항상 0. currentLevel/warnLevel/dangerLevel에서
 * floorLevel을 빼서 "바닥 = 0m" 기준으로 통일해서 보여준다.
 *
 * ★ 팝업 3종 (사다리꼴 버전 WaterAnimationSeoul.tsx에서 그대로 이식) ★
 *  - 수위계 사진 팝업: "수위계 모습" 버튼 클릭 시 photoImageUrl 이미지 표시
 *  - CCTV 링크없음 팝업: cctvUrl이 없을 때 "CCTV 링크" 버튼 클릭 시 안내
 *  - 경고/위험 알림 팝업: currentLevel이 danger/warn을 넘는 순간 1회 자동 표시
 *    (컴포넌트가 유지되는 동안 재알림 방지 - useRef 플래그)
 */

export interface WaterLevelHeroProps {
  /** 지점 이름, 예: "불광천 증산교" */
  siteName: string;
  /** 측정 시각 문자열 (API 원본 그대로, 예: "2026-07-08 12:00:00") */
  measuredAt: string;
  /** 현재 수위 (m) - 절대값(보정 전) */
  currentLevel: number;
  /** 경고 수위 (m) - 절대값(보정 전). 경고수위가 없는 지점이면 null */
  warnLevel: number | null;
  /** 위험 수위 (m) - 절대값(보정 전) */
  dangerLevel: number;
  /** 하천 바닥 높이 (m) - 절대값. 서울=RBH, 부산=0 */
  floorLevel: number;
  /** 정보 출처 텍스트 */
  source?: string;
  /** 수위계 사진 팝업에 쓸 이미지 URL, 예: `/images/${id}.jpg` */
  photoImageUrl: string;
  /** CCTV 링크. 없으면(undefined) "링크없음" 팝업이 뜸 */
  cctvUrl?: string;
  onBack?: () => void;
  onRefresh?: () => void;
}

const TOP_PADDING = 14;
const BOTTOM_PADDING = 6;

export default function WaterLevelHero({
  siteName,
  measuredAt,
  currentLevel,
  warnLevel,
  dangerLevel,
  floorLevel,
  source = '정보 출처 : 서울특별시 물순환안전국',
  photoImageUrl,
  cctvUrl,
  onBack,
  onRefresh,
}: WaterLevelHeroProps) {
  const [showPhoto, setShowPhoto] = useState(false);
  const [showNoLink, setShowNoLink] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const alertShown = useRef({ warn: false, danger: false });

  // ── 바닥 기준 보정 ──────────────────────────────────────────
  const calibratedCurrent = currentLevel - floorLevel;
  const calibratedDanger = dangerLevel - floorLevel;
  const calibratedWarn = warnLevel !== null ? warnLevel - floorLevel : null;

  // ── 경고/위험 알림 팝업 (사다리꼴 버전 로직 이식, 값은 보정된 값 기준) ──
  useEffect(() => {
    if (calibratedCurrent >= calibratedDanger && !alertShown.current.danger) {
      alertShown.current.danger = true;
      setAlertMsg(`⚠️ 위험수위 초과! 현재 ${calibratedCurrent.toFixed(2)}m`);
    } else if (
      calibratedWarn !== null &&
      calibratedCurrent >= calibratedWarn &&
      !alertShown.current.warn
    ) {
      alertShown.current.warn = true;
      setAlertMsg(`⚠️ 경고수위 초과! 현재 ${calibratedCurrent.toFixed(2)}m`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calibratedCurrent, calibratedDanger, calibratedWarn]);

  // 스케일 최대값: 위험수위보다 18% 여유
  const scaleMin = 0;
  const scaleMax = calibratedDanger * 1.18;

  const levelToTopPercent = useMemo(() => {
    return (value: number) => {
      const clamped = Math.min(Math.max(value, scaleMin), scaleMax);
      const ratio = (clamped - scaleMin) / (scaleMax - scaleMin);
      const usable = 100 - TOP_PADDING - BOTTOM_PADDING;
      return TOP_PADDING + (1 - ratio) * usable;
    };
  }, [scaleMax]);

  const waterTopPercent = levelToTopPercent(calibratedCurrent);
  const waterTopColor = '#6fb4f0'; // 물 그라데이션 상단색, Header 물결 패턴과 맞춤

  const ticks = [
    { key: 'danger', label: `위험 수위 (${calibratedDanger.toFixed(1)})m`, value: calibratedDanger, color: '#e02424' },
    ...(calibratedWarn !== null
      ? [{ key: 'warn', label: `경고 수위 (${calibratedWarn.toFixed(1)})m`, value: calibratedWarn, color: '#f5820a' }]
      : []),
    { key: 'current', label: `현재 수위 (${calibratedCurrent.toFixed(1)})m`, value: calibratedCurrent, color: '#2f8ce0' },
    { key: 'floor', label: '바닥 0.0m', value: 0, color: '#1a1a1a' },
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#fff' }}>
      {/* ---------- 왼쪽 상단: 타이틀 + 정보 + 버튼 ---------- */}
      <div style={{ position: 'absolute', top: '6vh', left: '5vw', zIndex: 10, maxWidth: 480 }}>
        <h1
          style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 800,
            lineHeight: 1.25,
            color: '#2f8ce0',
            margin: '0 0 28px 0',
          }}
        >
          실시간
          <br />
          하천 수위 정보
        </h1>

        <p style={{ fontSize: 'clamp(20px, 2.4vw, 26px)', fontWeight: 700, margin: '0 0 6px 0' }}>{siteName}</p>
        <p style={{ fontSize: 16, fontWeight: 600, margin: '0 0 22px 0' }}>{measuredAt}</p>

        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          <button
            type="button"
            onClick={() => setShowPhoto(true)}
            style={{
              minWidth: 140,
              borderRadius: 10,
              border: 'none',
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer',
              textAlign: 'left',
              padding: '14px 16px',
              backgroundColor: '#555',
            }}
          >
            <span style={{ fontWeight: 700 }}>📷 수위계 모습</span>
          </button>

          <button
            type="button"
            onClick={() => (cctvUrl ? window.open(cctvUrl, '_blank') : setShowNoLink(true))}
            style={{
              minWidth: 140,
              borderRadius: 10,
              border: 'none',
              color: '#fff',
              fontSize: 14,
              lineHeight: 1.4,
              cursor: 'pointer',
              textAlign: 'left',
              padding: '14px 16px',
              backgroundColor: '#555',
            }}
          >
            <span style={{ fontWeight: 700 }}>📹 CCTV 링크</span>
            <span style={{ display: 'block', marginTop: 6, color: '#d8d8d8', fontSize: 12 }}>
              다른 곳을 바라보고 있을 수 있습니다
            </span>
          </button>
        </div>

        <p style={{ fontSize: 13, color: '#6b6b6b', fontWeight: 600 }}>{source}</p>
      </div>

      {/* ---------- 왼쪽 하단: 목록으로 / 새로고침 ---------- */}
      <div style={{ position: 'absolute', left: '5vw', bottom: '5vh', zIndex: 10, display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: '#fff',
            border: '1.5px solid #d8d8d8',
            borderRadius: 999,
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ← 목록으로
        </button>
        <button
          type="button"
          onClick={onRefresh}
          style={{
            background: '#fff',
            border: '1.5px solid #d8d8d8',
            borderRadius: 999,
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ↻ 새로고침
        </button>
      </div>

      {/* ---------- 오른쪽 세로 눈금자 ---------- */}
      <div style={{ position: 'absolute', right: '6vw', top: 0, height: '100%', width: 220, zIndex: 10 }}>
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 2, background: '#cfcfcf' }} />
        {ticks.map((t) => {
          const top = levelToTopPercent(t.value);
          const isCurrent = t.key === 'current';
          return (
            <div
              key={t.key}
              style={{
                position: 'absolute',
                right: -2,
                top: `${top}%`,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                transform: 'translateY(-50%)',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  right: 26,
                  whiteSpace: 'nowrap',
                  fontWeight: 800,
                  fontSize: isCurrent ? 20 : t.key === 'floor' ? 15 : 18,
                  color: t.color,
                }}
              >
                {t.label}
              </span>
              <span
                style={{
                  width: isCurrent ? 26 : 18,
                  height: isCurrent ? 3 : 2,
                  background: t.color,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* ---------- 물: calibratedCurrent에 따라 top 위치가 바뀜 ---------- */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          top: `${waterTopPercent}%`,
          background: 'linear-gradient(180deg, #6fb4f0 0%, #2f7fd6 100%)',
          zIndex: 1,
          transition: 'top 0.6s ease-out',
        }}
      />

      {/* 물결 라인 - Header 컴포넌트와 동일한 패턴 재사용 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `calc(${waterTopPercent}% - 10px)`,
          height: '10px',
          zIndex: 2,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='10'%3E%3Cpath d='M0 10 Q9 9 10 0 Q11 9 20 10' stroke='${encodeURIComponent(
            waterTopColor
          )}' fill='${encodeURIComponent(waterTopColor)}' stroke-width='2'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat-x',
          transition: 'top 0.6s ease-out',
        }}
      />

      {/* ---------- 경고/위험 알림 팝업 ---------- */}
      {alertMsg && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={() => setAlertMsg(null)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 12, padding: '2rem 2.5rem', textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)', maxWidth: 360,
            }}
          >
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444', marginBottom: '1rem' }}>{alertMsg}</p>
            <button
              onClick={() => setAlertMsg(null)}
              style={{ padding: '0.5rem 1.5rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.9rem' }}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* ---------- 수위계 사진 팝업 ---------- */}
      {showPhoto && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={() => setShowPhoto(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: 12, padding: '1rem', maxWidth: '90vw', maxHeight: '80vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photoImageUrl}
              alt={`${siteName} 수위계`}
              style={{ maxWidth: '100%', maxHeight: '70vh', display: 'block' }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).alt = '사진 없음';
              }}
            />
            <button
              onClick={() => setShowPhoto(false)}
              style={{ marginTop: '0.75rem', width: '100%', padding: '0.5rem', background: '#555', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* ---------- CCTV 링크없음 팝업 ---------- */}
      {showNoLink && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={() => setShowNoLink(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', maxWidth: '90vw', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ fontSize: '1rem', color: '#555', marginBottom: '1rem' }}>본 수위계는 연결된 CCTV가 없습니다.</p>
            <button
              onClick={() => setShowNoLink(false)}
              style={{ padding: '0.5rem 1.5rem', background: '#555', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
