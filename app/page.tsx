"use client";

import { useEffect, useMemo, useState } from "react";
import KakaoMapView from "./KakaoMapView";

type Beach = { name: string; area: string; score: number; crowd: string; temp: number; water: number; wave: string; wind: string; tags: string[]; blurb: string; activities: string[] };

const beaches: Beach[] = [
  { name: "다대포해수욕장", area: "사하구", score: 92, crowd: "낮음", temp: 27, water: 24, wave: "0.5m", wind: "3m/s", tags: ["😌 혼잡도 낮음", "🌊 물놀이 좋음", "🌅 노을 추천", "📸 사진 명소"], blurb: "넓고 여유로운 해변에서 물놀이를 즐긴 뒤, 황금빛 노을까지 이어지는 완벽한 하루예요.", activities: ["물놀이", "노을", "산책", "한적"] },
  { name: "광안리해수욕장", area: "수영구", score: 90, crowd: "높음", temp: 28, water: 24, wave: "0.4m", wind: "2m/s", tags: ["🌉 광안대교 야경", "💑 데이트", "☕ 카페 거리", "🍴 맛집"], blurb: "광안대교가 빛나는 저녁, 감각적인 카페와 맛집까지 데이트 코스로 딱 좋아요.", activities: ["데이트", "야경", "맛집", "사진", "핫플"] },
  { name: "송정해수욕장", area: "해운대구", score: 84, crowd: "보통", temp: 27, water: 23, wave: "0.8m", wind: "4m/s", tags: ["🏄 서핑 가능", "🌊 해양레저", "🧑‍🤝‍🧑 젊은 분위기"], blurb: "파도와 바람이 적당해 처음 서핑을 즐기거나 활동적인 하루를 보내기 좋아요.", activities: ["서핑", "물놀이", "레저", "친구"] },
  { name: "해운대해수욕장", area: "해운대구", score: 82, crowd: "높음", temp: 28, water: 24, wave: "0.4m", wind: "2m/s", tags: ["🔥 관광 중심", "🍴 맛집", "🚇 접근성 좋음"], blurb: "관광·쇼핑·맛집을 모두 누리고 싶은 활기찬 여행에 잘 어울립니다.", activities: ["핫플", "맛집", "관광", "가족"] },
  { name: "일광해수욕장", area: "기장군", score: 86, crowd: "낮음", temp: 26, water: 23, wave: "0.5m", wind: "3m/s", tags: ["😌 조용한 휴식", "👨‍👩‍👧 가족", "🌿 산책"], blurb: "잔잔한 바다와 한적한 분위기에서 느긋하게 쉬어가기 좋습니다.", activities: ["한적", "가족", "산책", "물놀이"] },
  { name: "송도해수욕장", area: "서구", score: 78, crowd: "보통", temp: 27, water: 24, wave: "0.6m", wind: "3m/s", tags: ["🚠 해상케이블카", "🦶 산책", "📸 전망"], blurb: "바다 위 산책과 색다른 전망을 함께 즐길 수 있는 도심형 바다예요.", activities: ["사진", "산책", "관광"] },
  { name: "임랑해수욕장", area: "기장군", score: 80, crowd: "낮음", temp: 26, water: 23, wave: "0.5m", wind: "3m/s", tags: ["🤫 숨은 해변", "🌿 조용함", "📸 감성 사진"], blurb: "북적임을 벗어나 파도 소리와 함께 쉬고 싶은 날의 숨은 선택지입니다.", activities: ["한적", "사진", "산책"] },
];

const quick = ["🌊 물놀이", "🏄 서핑", "📸 사진", "💑 데이트", "👨‍👩‍👧 가족", "😌 한적한 곳", "🔥 핫플"];
const keywords: Record<string, string[]> = { "야경": ["야경", "데이트"], "데이트": ["데이트"], "여자친구": ["데이트"], "남자친구": ["데이트"], "서핑": ["서핑"], "한적": ["한적"], "조용": ["한적"], "물놀이": ["물놀이"], "친구": ["친구"], "맛집": ["맛집"], "노을": ["노을"], "가족": ["가족"], "관광": ["관광"], "유명": ["관광"], "핫플": ["핫플"], "사진": ["사진"] };
const restaurantLevel: Record<string, "다양함" | "보통" | "적음"> = {
  "해운대해수욕장": "다양함", "광안리해수욕장": "다양함", "송도해수욕장": "다양함",
  "송정해수욕장": "보통", "다대포해수욕장": "보통", "일광해수욕장": "보통", "임랑해수욕장": "적음",
};

export default function Home() {
  const [query, setQuery] = useState("친구들이랑 한적한 곳에서 물놀이하고 노을 보고 싶어");
  const [submitted, setSubmitted] = useState(true);
  const [selected, setSelected] = useState<Beach | null>(null);
  const [page, setPage] = useState<"home" | "map">("home");
  const [currentTemperature, setCurrentTemperature] = useState<number | null>(null);
  const ranked = useMemo(() => {
    const wants = Object.entries(keywords).flatMap(([word, values]) => query.includes(word) ? values : []);
    return beaches.map((b) => ({ ...b, match: b.score + b.activities.filter((a) => wants.includes(a)).length * 7 - (wants.includes("한적") && b.crowd === "높음" ? 22 : 0) })).sort((a,b) => b.match - a.match);
  }, [query]);
  const pick = selected || ranked[0];
  if (page === "map") return <KakaoMapView beachName={pick.name} onBack={() => setPage("home")} />;
  const doSearch = () => { setSelected(null); setSubmitted(true); };
  const scrollToSection = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  useEffect(() => {
    let active = true;
    fetch("/api/weather/current")
      .then((response) => response.ok ? response.json() : null)
      .then((data: { temperature?: number } | null) => {
        if (active && typeof data?.temperature === "number") setCurrentTemperature(data.temperature);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);
  return <main className="app-shell">
    <section className="hero">
      <div className="topline"><div className="brand"><span>🌊</span> 부산바다<b>ON</b></div><button className="bell" aria-label="알림">🔔</button></div>
      <p className="eyebrow">BUSAN SEA TRAVEL GUIDE</p>
      <h1>오늘, 어떤 바다에서<br/>놀고 싶나요?</h1>
      <p className="subcopy">말해주시면 바다 상태까지 살펴<br/>당신에게 딱 맞는 곳을 찾아드릴게요.</p>
      <div className="search"><span>✨</span><input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doSearch()} placeholder="예: 친구들이랑 한적한 곳에서 물놀이"/><button onClick={doSearch}>추천받기</button></div>
      <div className="chips">{quick.map((tag) => <button key={tag} onClick={() => { setQuery(tag.replace(/^.. /, "")); setSubmitted(false); }}>{tag}</button>)}</div>
    </section>

    <section className="content">
      <div className="weather"><div><span className="sample">{currentTemperature === null ? "예시 데이터" : "기상청 초단기실황"}</span><b>부산 현재</b><strong>{currentTemperature ?? 27}°</strong><span>맑음 · 습도 72%</span></div><div className="sun">☀️</div></div>
      {submitted && <div id="recommendation"><div className="section-title"><div><span>✨ AI 바다 추천</span><h2>오늘의 PICK</h2></div><span className="live">분석 완료</span></div>
      <article className="pick-card">
        <div className="ocean-art"><span>🌅</span><i>BUSAN</i></div><div className="pick-body"><div className="rank"><span>AI 추천도</span><b>{Math.min(96, pick.match)}%</b></div><h2>{pick.name}</h2><p>{pick.area} · 현재 혼잡도 <b className={pick.crowd === "높음" ? "red" : "green"}>{pick.crowd}</b></p><blockquote>“{pick.blurb}”</blockquote><div className="reason-tags">{pick.tags.slice(0,4).map(t => <span key={t}>{t}</span>)}</div><button className="detail" onClick={() => setPage("map")}>시설 보기 <b>→</b></button></div>
      </article>
      <div className="alternatives"><p>함께 살펴보세요</p>{ranked.slice(1,3).map((b, i) => <button key={b.name} onClick={() => setSelected(b)}><span className="place-num">0{i+2}</span><span><b>{b.name}</b><small>{b.crowd} · {b.activities.slice(0,2).join(" · ")}</small></span><strong>{Math.min(96,b.match)}%</strong></button>)}</div>
      {pick.crowd === "높음" && <div className="crowd-alert"><span>⚠️</span><div><b>현재 {pick.name.replace("해수욕장", "")}는 혼잡해요</b><p>비슷한 분위기의 더 여유로운 바다를 함께 확인해보세요.</p></div></div>}</div>}

      <section id="detail" className="detail-section"><div className="section-title"><div><span>🌊 {pick.name}</span><h2>오늘의 바다 상태</h2></div><span className="sample">예시 데이터</span></div><div className="stat-grid">{[["🌡️","기온",`${pick.temp}°C`],["🌊","수온",`${pick.water}°C`],["💨","바람",pick.wind],["〰️","파고",pick.wave],["👥","혼잡도",pick.crowd],["💧","습도","72%"]].map(x=><div key={x[1]}><span>{x[0]}</span><small>{x[1]}</small><b className={x[2] === "낮음" ? "green" : ""}>{x[2]}</b></div>)}</div><div className="index-card"><div><span>오늘의 바다 지수</span><h3>“바다를 즐기기 좋은 날이에요”</h3></div><div className="ratings">{[["물놀이",5],["산책",5],["사진",4],["서핑",2],["데이트",5]].map(([n,s]) => <div key={String(n)}><span>{n}</span><b>{"★".repeat(Number(s))}<i>{"★".repeat(5-Number(s))}</i></b></div>)}</div></div></section>

      <section id="ai-course" className="course"><div className="section-title"><div><span>✨ 부산바다ON 추천코스</span><h2>오늘의 AI 놀거리 코스</h2></div><span className="duration">약 5시간</span></div><p className="course-intro">입력하신 취향과 현재 상태를 반영했어요.</p><div className="timeline">{[["14:00","🌊",`${pick.name} 도착`,`해변 산책 후 자리 잡기`],["14:10","🏖️","시원한 물놀이","바다 상태가 잔잔해 안전하게 즐겨요"],["16:40","🦶","세족장 이용","가까운 시설에서 간단히 정리"],["17:00","🍴","근처 맛집 방문","부산의 맛을 담은 한 끼"],["18:20","📸","해변 산책 & 사진","햇살이 부드러워지는 시간"],["19:10","🌅","노을 감상","오늘 여행의 가장 빛나는 순간"]].map(x=><div className="timeline-item" key={String(x[0])}><time>{x[0]}</time><span className="dot">{x[1]}</span><div><b>{x[2]}</b><small>{x[3]}</small></div></div>)}</div></section>
      <section className="compare"><div className="section-title"><div><span>⚖️ 바다 비교</span><h2>어디로 갈지 고민된다면</h2></div></div><div className="compare-table"><div><b>구분</b><b>{ranked[0].name.replace("해수욕장","")}</b><b>{ranked[1].name.replace("해수욕장","")}</b><b>{ranked[2].name.replace("해수욕장","")}</b></div><div><span>혼잡도</span><span>{ranked[0].crowd}</span><span>{ranked[1].crowd}</span><span>{ranked[2].crowd}</span></div><div><span>물놀이</span><span>좋음</span><span>좋음</span><span>좋음</span></div><div><span>맛집</span><span>{restaurantLevel[ranked[0].name]}</span><span>{restaurantLevel[ranked[1].name]}</span><span>{restaurantLevel[ranked[2].name]}</span></div></div></section>
    </section>
    <nav><button className="active">🏠<span>홈</span></button><button onClick={() => scrollToSection("recommendation")}>🌊<span>바다</span></button><button onClick={() => setPage("map")}>🗺️<span>지도</span></button><button onClick={() => scrollToSection("ai-course")}>✨<span>AI코스</span></button><button>👤<span>MY</span></button></nav>
  </main>;
}
