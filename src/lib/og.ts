// 브라우저에서 사용할 수 있는 OG 메타데이터 추출 함수
export async function extractOGMetadataFromUrl(url: string): Promise<{ title: string; description: string; image?: string }> {
  // 1. fetch로 HTML 받아오기 (CORS 허용된 경우만 동작)
  const response = await fetch(url);
  const html = await response.text();

  // 2. DOMParser로 파싱
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // 3. OG 메타데이터 추출
  const getMeta = (property: string) =>
    doc.querySelector(`meta[property='${property}']`)?.getAttribute('content') ||
    doc.querySelector(`meta[name='${property}']`)?.getAttribute('content') || '';

  const title = getMeta('og:title') || getMeta('twitter:title') || doc.title || '';
  const description = getMeta('og:description') || getMeta('twitter:description') || getMeta('description') || '';
  const image = getMeta('og:image') || getMeta('twitter:image') || '';

  return { title, description, image };
} 