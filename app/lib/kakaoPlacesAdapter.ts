/**
 * Kakao Maps JavaScript SDK adapter.
 *
 * The SDK's Places callbacks follow the Local API place document shape:
 * place_name, category_name, phone, address_name, road_address_name,
 * x (longitude), y (latitude), place_url and distance.
 * This module is the only boundary that knows that provider response shape.
 *
 * Official references:
 * - https://apis.map.kakao.com/web/documentation/#KeywordSearch
 * - https://apis.map.kakao.com/web/documentation/#CategoryCode
 * - https://developers.kakao.com/docs/latest/ko/local/dev-guide
 */

export type BeachPoint = { lat: number; lng: number };
export type FacilityFilter = "전체" | "음식점" | "카페" | "편의점" | "주차장" | "화장실";
export type KakaoFacilityKind = Exclude<FacilityFilter, "전체">;

export type KakaoPlaceDocument = {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  category_group_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  distance: string;
};

export type FacilityPlace = {
  id: string;
  name: string;
  category: string;
  address: string;
  phone?: string;
  point: BeachPoint;
  distanceMeters?: number;
  url?: string;
  source: "kakao" | "busanbada-on";
};

type KakaoSearchOptions = {
  location: unknown;
  radius: number;
  size: number;
  sort: unknown;
};

type KakaoPlaces = {
  categorySearch: (code: string, callback: (data: KakaoPlaceDocument[], status: string) => void, options: KakaoSearchOptions) => void;
  keywordSearch: (keyword: string, callback: (data: KakaoPlaceDocument[], status: string) => void, options: KakaoSearchOptions) => void;
};

export type KakaoMapsSdk = {
  maps: {
    load: (callback: () => void) => void;
    LatLng: new (lat: number, lng: number) => unknown;
    Map: new (container: HTMLElement, options: { center: unknown; level: number }) => unknown;
    Marker: new (options: { map: unknown; position: unknown; title: string }) => { setMap: (map: unknown) => void };
    event: { addListener: (target: unknown, event: string, handler: () => void) => void };
    services: {
      Places: new () => KakaoPlaces;
      Status: { OK: string };
      SortBy: { DISTANCE: unknown };
    };
  };
};

const KAKAO_CATEGORY_CODES: Record<Exclude<KakaoFacilityKind, "화장실">, string> = {
  음식점: "FD6",
  카페: "CE7",
  편의점: "CS2",
  주차장: "PK6",
};

// Kakao's documented search radius unit is metres; 1.3 km keeps searches
// focused on the selected beach rather than all of Busan.
const SEARCH_RADIUS_METERS = 1300;
const SEARCH_PAGE_SIZE = 10;

function toFiniteNumber(value: string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export function adaptKakaoPlace(document: KakaoPlaceDocument, kind: KakaoFacilityKind): FacilityPlace | null {
  const lng = toFiniteNumber(document.x);
  const lat = toFiniteNumber(document.y);
  if (!document.id || !document.place_name || lat === undefined || lng === undefined) return null;

  return {
    id: `kakao:${document.id}`,
    name: document.place_name,
    category: document.category_name || kind,
    address: document.road_address_name || document.address_name || "주소 정보 없음",
    phone: document.phone || undefined,
    point: { lat, lng },
    distanceMeters: toFiniteNumber(document.distance),
    url: document.place_url || undefined,
    source: "kakao",
  };
}

type SearchDefinition =
  | { kind: Exclude<KakaoFacilityKind, "화장실">; code: string }
  | { kind: "화장실"; keyword: string };

function selectedSearches(filter: FacilityFilter, beachName: string): SearchDefinition[] {
  if (filter === "화장실") return [{ kind: "화장실" as const, keyword: `${beachName} 화장실` }];
  if (filter === "전체") {
    return [
      ...Object.entries(KAKAO_CATEGORY_CODES).map(([kind, code]) => ({ kind: kind as Exclude<KakaoFacilityKind, "화장실">, code })),
      { kind: "화장실" as const, keyword: `${beachName} 화장실` },
    ];
  }
  return [{ kind: filter as Exclude<KakaoFacilityKind, "화장실">, code: KAKAO_CATEGORY_CODES[filter as Exclude<KakaoFacilityKind, "화장실">] }];
}

export function searchKakaoFacilities({
  sdk,
  beachName,
  center,
  filter,
  onPlaces,
  onComplete,
}: {
  sdk: KakaoMapsSdk;
  beachName: string;
  center: BeachPoint;
  filter: FacilityFilter;
  onPlaces: (places: FacilityPlace[]) => void;
  onComplete?: () => void;
}) {
  const searches = selectedSearches(filter, beachName);
  const places = new sdk.maps.services.Places();
  const options: KakaoSearchOptions = {
    location: new sdk.maps.LatLng(center.lat, center.lng),
    radius: SEARCH_RADIUS_METERS,
    size: SEARCH_PAGE_SIZE,
    sort: sdk.maps.services.SortBy.DISTANCE,
  };
  let active = true;
  let pending = searches.length;

  const callback = (kind: KakaoFacilityKind) => (data: KakaoPlaceDocument[], status: string) => {
    if (!active) return;
    if (status === sdk.maps.services.Status.OK) {
      onPlaces(data.map((place) => adaptKakaoPlace(place, kind)).filter((place): place is FacilityPlace => place !== null));
    }
    pending -= 1;
    if (pending === 0) onComplete?.();
  };

  searches.forEach((search) => {
    if ("code" in search) places.categorySearch(search.code, callback(search.kind), options);
    else places.keywordSearch(search.keyword, callback(search.kind), options);
  });

  return () => { active = false; };
}
