/**
 * KMA ultra-short-term observation proxy.
 *
 * Official API: getUltraSrtNcst
 * https://www.data.go.kr/data/15084084/openapi.do
 *
 * The public route deliberately returns only the T1H observation. The KMA
 * service key never crosses this server boundary into client-side code.
 */

const KMA_ULTRA_SHORT_OBSERVATION_URL =
  "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst";

// KMA village-forecast grid point for Busan.
const BUSAN_GRID = { nx: 98, ny: 76 };
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

type KmaObservation = {
  baseDate: string;
  baseTime: string;
  category: string;
  obsrValue: string;
};

type KmaPayload = {
  response?: {
    header?: { resultCode?: string; resultMsg?: string };
    body?: { items?: { item?: KmaObservation[] | KmaObservation } };
  };
};

function latestAvailableBaseDateTime(now = new Date()) {
  const kst = new Date(now.getTime() + KST_OFFSET_MS);

  // Give the upstream hourly observation a small publication buffer. Before
  // :45 KST, request the preceding hourly base time instead of a potentially
  // unpublished current-hour observation.
  if (kst.getUTCMinutes() < 45) kst.setUTCHours(kst.getUTCHours() - 1);
  kst.setUTCMinutes(0, 0, 0);

  const date = `${kst.getUTCFullYear()}${String(kst.getUTCMonth() + 1).padStart(2, "0")}${String(kst.getUTCDate()).padStart(2, "0")}`;
  const time = `${String(kst.getUTCHours()).padStart(2, "0")}00`;
  return { date, time };
}

function decodedServiceKey(key: string) {
  try {
    return decodeURIComponent(key);
  } catch {
    return key;
  }
}

function observationItems(payload: KmaPayload) {
  const item = payload.response?.body?.items?.item;
  return Array.isArray(item) ? item : item ? [item] : [];
}

export async function GET() {
  const serviceKey = process.env.KMA_SERVICE_KEY;
  if (!serviceKey) {
    return Response.json({ error: "KMA_SERVICE_NOT_CONFIGURED" }, { status: 503 });
  }

  const { date, time } = latestAvailableBaseDateTime();
  const params = new URLSearchParams({
    serviceKey: decodedServiceKey(serviceKey),
    pageNo: "1",
    numOfRows: "1000",
    dataType: "JSON",
    base_date: date,
    base_time: time,
    nx: String(BUSAN_GRID.nx),
    ny: String(BUSAN_GRID.ny),
  });

  try {
    const upstream = await fetch(`${KMA_ULTRA_SHORT_OBSERVATION_URL}?${params}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 600 },
    });
    const payload = (await upstream.json()) as KmaPayload;
    const header = payload.response?.header;

    if (!upstream.ok || header?.resultCode !== "00") {
      return Response.json({ error: "KMA_UPSTREAM_ERROR" }, { status: 502 });
    }

    const temperatureItem = observationItems(payload).find((item) => item.category === "T1H");
    const temperature = Number(temperatureItem?.obsrValue);
    if (!temperatureItem || !Number.isFinite(temperature)) {
      return Response.json({ error: "KMA_T1H_NOT_AVAILABLE" }, { status: 502 });
    }

    return Response.json(
      {
        location: "부산",
        temperature,
        unit: "°C",
        observedAt: `${temperatureItem.baseDate}${temperatureItem.baseTime}`,
        source: "KMA_ULTRA_SHORT_OBSERVATION",
      },
      { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300" } },
    );
  } catch {
    return Response.json({ error: "KMA_UPSTREAM_UNAVAILABLE" }, { status: 502 });
  }
}
