"use client";

import { useEffect, useRef, useState } from "react";

type Props = { beachName: string; onBack: () => void };
type PlaceInfo = { name: string; category: string; address: string; phone?: string; distance: string; url?: string };
type BeachPoint = { lat: number; lng: number };

const beaches: Record<string, BeachPoint> = {
  "해운대해수욕장": { lat: 35.1587, lng: 129.1604 }, "광안리해수욕장": { lat: 35.1532, lng: 129.1186 },
  "송정해수욕장": { lat: 35.1785, lng: 129.2005 }, "송도해수욕장": { lat: 35.0758, lng: 129.0168 },
  "다대포해수욕장": { lat: 35.0466, lng: 128.9670 }, "일광해수욕장": { lat: 35.2604, lng: 129.2332 }, "임랑해수욕장": { lat: 35.3180, lng: 129.2633 },
};
const filters = ["전체", "음식점", "카페", "편의점", "주차장", "화장실"] as const;
const categories: Record<(typeof filters)[number], Array<{ label: string; code?: string; keyword?: string }>> = {
  전체: [{ label: "음식점", code: "FD6" }, { label: "카페", code: "CE7" }, { label: "편의점", code: "CS2" }, { label: "주차장", code: "PK6" }, { label: "화장실", keyword: "화장실" }],
  음식점: [{ label: "음식점", code: "FD6" }], 카페: [{ label: "카페", code: "CE7" }], 편의점: [{ label: "편의점", code: "CS2" }], 주차장: [{ label: "주차장", code: "PK6" }], 화장실: [{ label: "화장실", keyword: "화장실" }],
};
const emoji: Record<string, string> = { 음식점: "🍴", 카페: "☕", 편의점: "🏪", 주차장: "🅿️", 화장실: "🚻", 시설: "🛟" };
const internalFacilities = [
  { name: "해변 안전시설", type: "시설", dLat: 0.001, dLng: 0.0004 }, { name: "세족장", type: "시설", dLat: -0.0006, dLng: 0.0008 },
  { name: "샤워장", type: "시설", dLat: 0.0003, dLng: -0.001 }, { name: "해변 화장실", type: "화장실", dLat: -0.0009, dLng: -0.0005 },
];

declare global { interface Window { kakao?: any; __busanKakaoReady?: Promise<void> } }

function loadKakao(key: string) {
  if (window.kakao?.maps?.services) return Promise.resolve();
  if (!window.__busanKakaoReady) window.__busanKakaoReady = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services&autoload=false`;
    script.async = true; script.onload = () => window.kakao.maps.load(resolve); script.onerror = () => reject(new Error("kakao-load"));
    document.head.appendChild(script);
  });
  return window.__busanKakaoReady;
}

function distance(a: BeachPoint, b: BeachPoint) {
  const r = 6371000, rad = Math.PI / 180, dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  const meters = 2 * r * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`;
}

export default function KakaoMapView({ beachName, onBack }: Props) {
  const container = useRef<HTMLDivElement>(null), mapRef = useRef<any>(null), markers = useRef<any[]>([]);
  const [filter, setFilter] = useState<(typeof filters)[number]>("전체");
  const [error, setError] = useState(false), [selected, setSelected] = useState<PlaceInfo | null>(null), [locating, setLocating] = useState(false), [mapReady, setMapReady] = useState(false);
  const center = beaches[beachName] ?? beaches["다대포해수욕장"], key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  const clearMarkers = () => { markers.current.forEach((marker) => marker.setMap(null)); markers.current = []; };
  const addMarker = (position: BeachPoint, info: PlaceInfo, title: string) => {
    const point = new window.kakao.maps.LatLng(position.lat, position.lng);
    const marker = new window.kakao.maps.Marker({ map: mapRef.current, position: point, title });
    window.kakao.maps.event.addListener(marker, "click", () => setSelected(info)); markers.current.push(marker);
  };

  useEffect(() => {
    if (!key || !container.current) { setError(true); return; }
    let cancelled = false;
    loadKakao(key).then(() => {
      if (cancelled || !container.current) return;
      const point = new window.kakao.maps.LatLng(center.lat, center.lng);
      mapRef.current = new window.kakao.maps.Map(container.current, { center: point, level: 4 });
      markers.current = [];
      setMapReady(true);
    }).catch(() => setError(true));
    return () => { cancelled = true; clearMarkers(); };
  }, [key, beachName, center.lat, center.lng]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.kakao?.maps?.services) return;
    clearMarkers();
    const point = new window.kakao.maps.LatLng(center.lat, center.lng);
    Object.entries(beaches).forEach(([name, beach]) => {
      const marker = new window.kakao.maps.Marker({ map: mapRef.current, position: new window.kakao.maps.LatLng(beach.lat, beach.lng), title: name === beachName ? `${name} (추천 바다)` : name });
      window.kakao.maps.event.addListener(marker, "click", () => mapRef.current.panTo(new window.kakao.maps.LatLng(beach.lat, beach.lng)));
      markers.current.push(marker);
    });
    const facilitySet = filter === "전체" ? internalFacilities : filter === "화장실" ? internalFacilities.filter((item) => item.type === "화장실") : [];
    facilitySet.forEach((facility) => {
      const position = { lat: center.lat + facility.dLat, lng: center.lng + facility.dLng };
      addMarker(position, { name: `${beachName} ${facility.name}`, category: facility.type, address: "부산바다ON 자체 시설 정보", distance: `해수욕장 기준 ${distance(center, position)}` }, emoji[facility.type]);
    });
    const places = new window.kakao.maps.services.Places(); let cancelled = false;
    const result = (label: string) => (data: any[], status: string) => {
      if (cancelled || status !== window.kakao.maps.services.Status.OK) return;
      data.forEach((place) => addMarker({ lat: Number(place.y), lng: Number(place.x) }, { name: place.place_name, category: label, address: place.road_address_name || place.address_name || "주소 정보 없음", phone: place.phone, distance: `해수욕장 기준 ${place.distance || distance(center, { lat: Number(place.y), lng: Number(place.x) })}`, url: place.place_url }, emoji[label]));
    };
    categories[filter].forEach((item) => {
      const options = { location: point, radius: 1300, size: 10, sort: window.kakao.maps.services.SortBy.DISTANCE };
      if (item.code) places.categorySearch(item.code, result(item.label), options);
      else places.keywordSearch(`${beachName} ${item.keyword}`, result(item.label), options);
    });
    return () => { cancelled = true; };
  }, [filter, mapReady, beachName, center.lat, center.lng]);

  const showLocation = () => {
    if (!navigator.geolocation || !mapRef.current) return; setLocating(true);
    navigator.geolocation.getCurrentPosition(({ coords }) => { const position = { lat: coords.latitude, lng: coords.longitude }; new window.kakao.maps.Marker({ map: mapRef.current, position: new window.kakao.maps.LatLng(position.lat, position.lng), title: "내 위치" }); mapRef.current.panTo(new window.kakao.maps.LatLng(position.lat, position.lng)); setLocating(false); }, () => setLocating(false), { enableHighAccuracy: true, timeout: 10000 });
  };

  return <section className="real-map-page"><header className="map-header"><button onClick={onBack} aria-label="홈으로 돌아가기">‹</button><div><span>🌊 부산바다ON 지도</span><b>{beachName} 주변 시설</b></div><button onClick={showLocation} aria-label="내 위치 표시">{locating ? "…" : "◎"}</button></header><div className="map-filter">{filters.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div><div className="kakao-map" ref={container}>{error && <div className="map-error"><b>지도 정보를 불러오지 못했습니다.</b><span>잠시 후 다시 시도해주세요.</span></div>}</div><div className="map-legend"><span>🌊 추천 해수욕장</span><span>🍴 음식점</span><span>☕ 카페</span><span>🏪 편의점</span><span>🛟 자체 시설</span></div>{selected && <article className="place-card"><button onClick={() => setSelected(null)} aria-label="장소 정보 닫기">×</button><span>{emoji[selected.category] || "📍"}</span><div><b>{selected.name}</b><small>{selected.category}</small><p>📍 {selected.address}</p><p>↔ {selected.distance}{selected.phone && ` · ${selected.phone}`}</p>{selected.url && <a href={selected.url} target="_blank" rel="noreferrer">카카오맵에서 보기 ↗</a>}</div></article>}</section>;
}
