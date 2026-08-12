# 부산바다ON

여행 취향과 해수욕장 상태를 바탕으로 부산 바다와 하루 코스를 추천하는 모바일 웹앱입니다.

## Kakao Maps 연결하기

지도 화면은 Kakao Maps JavaScript API와 `services` 라이브러리를 사용합니다. 주변 음식점·카페·편의점·주차장은 카테고리 검색으로, 화장실은 해수욕장 주변 키워드 검색과 부산바다ON 자체 시설 데이터로 표시합니다.

### 1. Kakao Developers에서 애플리케이션 생성

1. [Kakao Developers](https://developers.kakao.com)에 로그인합니다.
2. **내 애플리케이션 → 애플리케이션 추가하기**를 선택합니다.
3. 앱 이름을 입력해 앱을 만듭니다.

### 2. JavaScript 키 확인 및 지도 사용 설정

1. 생성한 앱의 **앱 설정 → 앱 키**에서 **JavaScript 키**를 복사합니다.
2. **제품 설정 → 지도**에서 Kakao Maps 사용 설정을 켭니다.

### 3. Web 플랫폼 도메인 등록

1. **앱 설정 → 플랫폼 → Web 플랫폼 등록**으로 이동합니다.
2. 개발 중에는 `http://localhost:3000`을 등록합니다.
3. 배포한 뒤에는 실제 서비스 주소도 등록합니다. 예: `https://your-domain.com`

### 4. 환경변수 만들기

프로젝트 최상단에서 `.env.local` 파일을 만들고 키를 넣습니다. `.env.local`은 저장소에 올리지 마세요.

```env
NEXT_PUBLIC_KAKAO_MAP_KEY=여기에_JavaScript_키
```

키를 추가하거나 바꾼 뒤에는 개발 서버를 다시 시작해야 합니다.

## 개발 서버 실행

Node.js 22 이상에서 다음을 실행합니다.

```bash
npm install
npm run dev
```

터미널이 안내하는 주소(대개 `http://localhost:3000`)를 브라우저에서 여세요.

## GitHub Pages 공개 배포

GitHub Pages는 `gh-pages` 브랜치의 정적 빌드를 공개합니다.

1. Kakao Developers의 **Web 플랫폼**에 `https://2ndroy2009roy-collab.github.io`를 등록합니다.
2. `NEXT_PUBLIC_KAKAO_MAP_KEY`가 설정된 환경에서 `npm run build:pages`를 실행합니다.
3. 생성된 `gh-pages-dist` 폴더를 `gh-pages` 브랜치의 루트에 올립니다.
4. `https://2ndroy2009roy-collab.github.io/busanbada-on/`에서 공개 사이트를 확인합니다.

Kakao Maps JavaScript 키는 브라우저에서 사용하는 공개 키입니다. 키를 소스 코드나 `.env.example`에 직접 저장하지 마세요.

## 지도 사용법

- 추천 카드의 **시설 보기** 또는 하단 **지도** 메뉴를 누르면 추천 해수욕장 중심의 지도가 열립니다.
- 상단 필터로 전체·음식점·카페·편의점·주차장·화장실을 선택합니다.
- 마커를 누르면 주소, 전화번호, 해수욕장 기준 거리와 카카오맵 상세 링크를 확인할 수 있습니다.
- `◎` 버튼은 위치 권한을 요청해 현재 위치를 표시합니다. 거부해도 나머지 기능은 정상 동작합니다.
