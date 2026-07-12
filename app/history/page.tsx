'use client';
// app/history/page.tsx

import { useState, useRef } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

// ── 관측소 목록 ───────────────────────────────────────
const SEOUL_STATIONS = [
  { id: '2301', name: '도림천 신대방역' },
  { id: '2303', name: '도림천 양산교' },
  { id: '2002', name: '도림천 도림교' },
  { id: '2003', name: '목감천 광화교' },
  { id: '301',  name: '방학천 모래말옆' },
  { id: '1401', name: '불광천 증산교' },
  { id: '2001', name: '안양천 고척교' },
  { id: '2201', name: '안양천 기아대교' },
  { id: '303',  name: '우이천 계성교' },
  { id: '401',  name: '우이천 장월교' },
  { id: '801',  name: '정릉천 용두교' },
  { id: '302',  name: '중랑천 노원교' },
  { id: '402',  name: '중랑천 신의교' },
  { id: '403',  name: '중랑천 월계1교' },
  { id: '901',  name: '중랑천 성동교' },
  { id: '101',  name: '탄천 여수대교' },
  { id: '102',  name: '탄천 대곡교' },
  { id: '103',  name: '탄천 탄천2교' },
  { id: '2502', name: '탄천 봉은교' },
  { id: '902',  name: '청계천 마장2교' },
  { id: '1501', name: '홍제천 성산2교' },
];

const BUSAN_STATIONS = [
//  { id: '00-200-0001', name: '동천교' },
//  { id: '00-200-0002', name: '범5호교' },
//  { id: '00-200-0003', name: '화명교' },
//  { id: '00-200-0004', name: '학장교' },
  { id: '00-200-0005', name: '동백천' },
  { id: '00-200-0006', name: '임기천' },
//  { id: '00-200-0007', name: '용소천' },
//  { id: '00-200-0008', name: '효암천' },
//  { id: '00-200-0009', name: '고래골천' },
//  { id: '00-200-0010', name: '이곡천' },
//  { id: '00-200-0011', name: '대천교' },
//  { id: '00-200-0012', name: '삼락22호교' },
//  { id: '00-200-0013', name: '청천교' },
//  { id: '00-200-0014', name: '용상교' },
//  { id: '00-210-0001', name: '장전동역' },
//  { id: '00-210-0002', name: '연안교' },
//  { id: '00-210-0003', name: '원동교' },
//  { id: '00-210-0004', name: '온천천 하류' },
//  { id: '00-210-0007', name: '중앙여고' },
//  { id: '00-210-0008', name: '온천장역 북측' },
];

interface WaterRecord {
  recorded_at:  string;
  observed_at:  string | null;
  water_level:  number;
  warn_level:   number | null;
  danger_level: number | null;
  site_name:    string;
}

// 날짜 문자열 → "2026년 7월 7일 20시 30분" 형식으로 변환
function formatKoreanDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours()}시 ${String(d.getMinutes()).padStart(2, '0')}분`;
}

// ── 간단한 SVG 라인 차트 (호버 시 수위 표시 기능 포함) ─────
function LineChart({ data }: { data: WaterRecord[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) return null;

  const W = 800;
  const H = 300;
  const PAD = { top: 20, right: 20, bottom: 50, left: 50 };

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top  - PAD.bottom;

  const levels   = data.map(d => d.water_level);
  const minLevel = Math.min(...levels) * 0.95;
  const maxLevel = Math.max(
    ...levels,
    ...data.map(d => d.warn_level   ?? 0),
    ...data.map(d => d.danger_level ?? 0),
  ) * 1.05;

  const xScale = (i: number) => PAD.left + (i / (data.length - 1)) * chartW;
  const yScale = (v: number) => PAD.top + chartH - ((v - minLevel) / (maxLevel - minLevel)) * chartH;

  // 현재수위 선 경로
  const path = data.map((d, i) =>
    `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)},${yScale(d.water_level).toFixed(1)}`
  ).join(' ');

  // 경고/위험수위 (첫 번째 데이터 기준)
  const warnLevel   = data[0].warn_level;
  const dangerLevel = data[0].danger_level;
  const warnY   = warnLevel   ? yScale(warnLevel)   : null;
  const dangerY = dangerLevel ? yScale(dangerLevel)  : null;

  // X축 라벨 (5개만 표시)
  const labelIndices = [0, Math.floor(data.length/4), Math.floor(data.length/2), Math.floor(data.length*3/4), data.length-1]
    .filter((v, i, a) => a.indexOf(v) === i);

  // Y축 라벨 (5개)
  const yLabels = Array.from({ length: 5 }, (_, i) =>
    minLevel + (maxLevel - minLevel) * i / 4
  );


  // 마우스 위치 → 가장 가까운 데이터 인덱스 계산
  const handleMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    // 화면 픽셀 좌표를 viewBox(800x300) 좌표로 변환
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const ratio = (svgX - PAD.left) / chartW;
    const idx = Math.round(ratio * (data.length - 1));
    const clamped = Math.min(Math.max(idx, 0), data.length - 1);
    setHoverIndex(clamped);
  };

  const handleMouseLeave = () => setHoverIndex(null);

  // 호버 중인 데이터 포인트 정보
  const hovered = hoverIndex !== null ? data[hoverIndex] : null;
  const hoverX = hoverIndex !== null ? xScale(hoverIndex) : 0;
  const hoverY = hovered ? yScale(hovered.water_level) : 0;

  // 툴팁 박스 크기 및 위치 (차트 밖으로 넘치지 않도록 좌우 보정)
  const boxW = 180;
  const boxH = 80;
  let boxX = hoverX + 14;
  if (boxX + boxW > W - PAD.right) boxX = hoverX - boxW - 14;
  let boxY = hoverY - boxH - 14;
  if (boxY < PAD.top) boxY = hoverY + 14;

  return (
    <svg
      ref={svgRef}  

      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto' }}
    >
      {/* 배경 그리드 */}
      {yLabels.map((v, i) => (
        <g key={i}>
          <line
            x1={PAD.left} y1={yScale(v)}
            x2={W - PAD.right} y2={yScale(v)}
            stroke="#ddd" strokeWidth="1"
          />
          <text x={PAD.left - 6} y={yScale(v) + 4} fontSize="10" textAnchor="end" fill="#888">
            {v.toFixed(2) } m
          </text>
        </g>
      ))}

      {/* 위험수위 선 */}
      {dangerY && (
        <>
          <line x1={PAD.left} y1={dangerY} x2={W - PAD.right} y2={dangerY}
            stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6 3" />
          <text x={W - PAD.right} y={dangerY + 4} fontSize="10" fill="#ef4444">위험</text>
        </>
      )}

      {/* 경고수위 선 */}
      {warnY && warnLevel && warnLevel > minLevel && (
        <>
          <line x1={PAD.left} y1={warnY} x2={W - PAD.right} y2={warnY}
            stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6 3" />
          <text x={W - PAD.right} y={warnY + 4} fontSize="10" fill="#f59e0b">경고</text>
        </>
      )}

      {/* 현재수위 선 */}
      <path d={path} fill="none" stroke="#63adf8" strokeWidth="2" />

      {/* X축 */}
      <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom}
        stroke="#ccc" strokeWidth="1" />

      {/* X축 라벨 */}
      {labelIndices.map(i => (
        <text key={i} x={xScale(i)} y={H - PAD.bottom + 16} fontSize="9"
          textAnchor="end" fill="#888"
          transform={`rotate(-60, ${xScale(i)}, ${H - PAD.bottom + 16})`}
        >
          {(data[i].observed_at ?? data[i].recorded_at).slice(0, 16).replace('T', ' ')}
        </text>
      ))}

      {/* Y축 */}
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom}
        stroke="#ccc" strokeWidth="1" />


      {/* 호버 시 십자선 + 마커 + 정보 박스 */}
      {hovered && (
        <>
          {/* 세로 십자선 */}
          <line
            x1={hoverX} y1={PAD.top} x2={hoverX} y2={H - PAD.bottom}
            stroke="#333" strokeWidth="1" strokeDasharray="4 3"
          />
          {/* 데이터 포인트 마커 */}
          <circle cx={hoverX} cy={hoverY} r="5" fill="#63adf8" stroke="#fff" strokeWidth="2" />

          {/* 정보 박스 */}
          <rect
            x={boxX} y={boxY} width={boxW} height={boxH}
            fill="#fff" stroke="#333" strokeWidth="1.5" rx="4"
          />
          <text x={boxX + 10} y={boxY + 18} fontSize="10" fontWeight="600" fill="#333">
            {formatKoreanDateTime(hovered.observed_at ?? hovered.recorded_at)}
          </text>
          <text x={boxX + 10} y={boxY + 36} fontSize="10" fontWeight="600" fill="#333">
            {hovered.site_name}
          </text>
          <text x={boxX + 10} y={boxY + 54} fontSize="11" fontWeight="700" fill="#63adf8">
            당시 수위 : {hovered.water_level.toFixed(2)} m
          </text>
          <text x={boxX + 10} y={boxY + 72} fontSize="11" fontWeight="700" fill="#ef4444">
            위험 수위 : {hovered.danger_level?.toFixed(2) ?? 'N/A'} m
          </text>
        </>
      )}

      {/* 마우스 이벤트 감지용 투명 오버레이 (차트 전체 영역) */}
      <rect
        x={PAD.left} y={PAD.top} width={chartW} height={chartH}
        fill="transparent"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'crosshair' }}
      />


    </svg>
  );
}

// ── 메인 페이지 ───────────────────────────────────────
export default function HistoryPage() {
  const [region,    setRegion]    = useState<'seoul' | 'busan'>('seoul');
  const [siteId,    setSiteId]    = useState('');
  const [fromDate,  setFromDate]  = useState('');
  const [toDate,    setToDate]    = useState('');
  const [data,      setData]      = useState<WaterRecord[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [siteName,  setSiteName]  = useState('');

  const stations = region === 'seoul' ? SEOUL_STATIONS : BUSAN_STATIONS;

  const handleSearch = async () => {
    if (!siteId)    return setError('관측소를 선택해주세요.');
    if (!fromDate)  return setError('시작 시간을 입력해주세요.');
    if (!toDate)    return setError('종료 시간을 입력해주세요.');
    setError('');
    setLoading(true);

    // 부산은 00- 접두사 포함된 siteId 그대로 사용
    const params = new URLSearchParams({
      site:   siteId,
      region,
      from:   fromDate,
      to:     toDate,
    });

    try {
      const res = await fetch(`/api/history?${params}`);
      if (!res.ok) throw new Error();
      const json: WaterRecord[] = await res.json();
      setData(json);
      setSiteName(json[0]?.site_name ?? siteId);
      if (json.length === 0) setError('해당 기간에 데이터가 없습니다.');
    } catch {
      setError('데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: '0.4rem 0.6rem',
    fontSize: '0.85rem',
    border: '1px solid #ccc',
    borderRadius: '6px',
    background: '#fff',
    color: '#333',
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: '20vh 80vh',
      gridTemplateColumns: '20% 80%',
      height: '100vh',
      width: '100vw',
    }}>
      <Header />
      <Sidebar />

      {/* 메인 콘텐츠 */}
      <main style={{
        gridColumn: '2', gridRow: '2',
        background: '#f8f9fa',
        overflow: 'auto',
        padding: '1.5rem 2rem',
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333', marginBottom: '1.2rem' }}>
          수위 이력 조회
        </h2>
        <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          본 사이트가 만들어진 2026년 7월 13일 0시 이후의 데이터만 제공됩니다.
        </p>
        {/* 검색 폼 */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '0.75rem',
          alignItems: 'center', marginBottom: '1.5rem',
          background: '#fff', padding: '1rem',
          borderRadius: '8px', border: '1px solid #e0e0e0',
        }}>
          {/* 지역 선택 */}
          <select
            value={region}
            onChange={e => { setRegion(e.target.value as 'seoul' | 'busan'); setSiteId(''); }}
            style={inputStyle}
          >
            <option value="seoul">서울</option>
            <option value="busan">부산</option>
          </select>

          {/* 관측소 선택 */}
          <select value={siteId} onChange={e => setSiteId(e.target.value)} style={inputStyle}>
            <option value="">관측소 선택</option>
            {stations.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* 시작 시간 */}
          <input
            type="datetime-local"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            style={inputStyle}
          />
          <span style={{ color: '#888', fontSize: '0.85rem' }}>~</span>
          {/* 종료 시간 */}
          <input
            type="datetime-local"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            style={inputStyle}
          />

          {/* 조회 버튼 */}
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              padding: '0.4rem 1.2rem',
              fontSize: '0.85rem',
              background: '#63adf8',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? '조회 중…' : '조회'}
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>
        )}

        {/* 차트 */}
        {data.length > 0 && (
          <div style={{
            background: '#fff', borderRadius: '8px',
            border: '1px solid #e0e0e0', padding: '1.5rem',
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#333', marginBottom: '1rem' }}>
              {siteName} 수위 이력
              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#888', marginLeft: '0.5rem' }}>
                ({data.length}건)
              </span>
            </h3>
            <LineChart data={data} />
          </div>
        )}
      </main>
    </div>
  );
}
