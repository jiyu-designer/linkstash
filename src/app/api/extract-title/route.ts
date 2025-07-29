import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface ExtractTitleResponse {
  title: string;
  description?: string;
  url: string;
}

// 브런치 사이트 전용 메타데이터 추출 함수
async function extractBrunchMetadata(url: string): Promise<{ title: string; description: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 브런치는 20초로 증가

  try {
    // 브런치 사이트는 리다이렉트가 많으므로 더 간단한 접근 방법 사용
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://brunch.co.kr/'
      },
      redirect: 'manual' // 리다이렉트를 수동으로 처리
    });

    if (!response.ok && response.status !== 301 && response.status !== 302) {
      throw new Error(`HTTP ${response.status}`);
    }

    // 리다이렉트가 있는 경우 최종 URL로 다시 요청
    let finalUrl = url;
    if (response.status === 301 || response.status === 302) {
      const location = response.headers.get('location');
      if (location) {
        finalUrl = location.startsWith('http') ? location : `https://brunch.co.kr${location}`;
        
        const finalResponse = await fetch(finalUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Referer': 'https://brunch.co.kr/'
          }
        });
        
        if (!finalResponse.ok) {
          throw new Error(`HTTP ${finalResponse.status}`);
        }
        
        const html = await finalResponse.text();
        const $ = cheerio.load(html);
        
        // 브런치 사이트 전용 메타데이터 추출 순서
        let title = '';
        let description = '';
        
        // 1. OG 메타데이터 우선 (가장 신뢰할 수 있는 소스)
        title = $('meta[property="og:title"]').attr('content')?.trim() || 
                $('meta[name="twitter:title"]').attr('content')?.trim() || '';
        
        description = $('meta[property="og:description"]').attr('content')?.trim() || 
                     $('meta[name="twitter:description"]').attr('content')?.trim() || '';
        
        // 2. 브런치 전용 메타데이터 (og:title이 없을 경우)
        if (!title) {
          title = $('meta[name="title"]').attr('content')?.trim() || 
                  $('title').text().trim() || '';
        }
        
        if (!description) {
          description = $('meta[name="description"]').attr('content')?.trim() || '';
        }
        
        // 3. 브런치 사이트의 특정 구조에서 추출 (더 구체적인 선택자들)
        if (!title) {
          // 브런치 글 제목이 있는 특정 선택자들 (우선순위 순서)
          title = $('.post_title, .article_title, h1.title, .post-header h1, .article-header h1, .post-title, .article-title, .content-title, h1.post-title, h1.article-title').first().text().trim() || '';
        }
        
        if (!description) {
          // 브런치 글 요약이나 첫 번째 문단 (더 구체적인 선택자들)
          description = $('.post_summary, .article_summary, .post-content p, .article-content p, .content-summary, .post-description, .article-description, .content-description, .post-excerpt, .article-excerpt').first().text().trim() || '';
        }
        
        // 4. 브런치 사이트의 JSON-LD 스크립트에서 추출
        if (!title || !description) {
          $('script[type="application/ld+json"]').each((i, el) => {
            try {
              const jsonData = JSON.parse($(el).html() || '{}');
              if (jsonData['@type'] === 'Article' || jsonData['@type'] === 'BlogPosting') {
                if (!title && jsonData.headline) {
                  title = jsonData.headline;
                }
                if (!description && jsonData.description) {
                  description = jsonData.description;
                }
              }
            } catch (e) {
              // JSON 파싱 실패 시 무시
            }
          });
        }
        
        // 5. 브런치 사이트의 특정 클래스나 ID에서 추출
        if (!title) {
          title = $('[class*="title"], [class*="Title"], [id*="title"], [id*="Title"]').first().text().trim() || '';
        }
        
        if (!description) {
          description = $('[class*="summary"], [class*="Summary"], [class*="description"], [class*="Description"], [class*="excerpt"], [class*="Excerpt"]').first().text().trim() || '';
        }
        
        // 6. 최종 fallback
        if (!title) {
          title = $('title').text().trim() || '';
        }
        
        // 브런치 사이트에서 불필요한 접미사 제거
        if (title.includes(' - 브런치')) {
          title = title.replace(' - 브런치', '').trim();
        }
        if (title.includes(' | 브런치')) {
          title = title.replace(' | 브런치', '').trim();
        }
        
        // 설명이 너무 길면 자르기 (200자 제한)
        if (description && description.length > 200) {
          description = description.substring(0, 200) + '...';
        }
        
        clearTimeout(timeoutId);
        return { title, description };
      }
    }

    // 리다이렉트가 없는 경우 원래 응답 사용
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // 브런치 사이트 전용 메타데이터 추출 순서
    let title = '';
    let description = '';
    
    // 1. OG 메타데이터 우선 (가장 신뢰할 수 있는 소스)
    title = $('meta[property="og:title"]').attr('content')?.trim() || 
            $('meta[name="twitter:title"]').attr('content')?.trim() || '';
    
    description = $('meta[property="og:description"]').attr('content')?.trim() || 
                 $('meta[name="twitter:description"]').attr('content')?.trim() || '';
    
    // 2. 브런치 전용 메타데이터 (og:title이 없을 경우)
    if (!title) {
      title = $('meta[name="title"]').attr('content')?.trim() || 
              $('title').text().trim() || '';
    }
    
    if (!description) {
      description = $('meta[name="description"]').attr('content')?.trim() || '';
    }
    
    // 3. 브런치 사이트의 특정 구조에서 추출 (더 구체적인 선택자들)
    if (!title) {
      // 브런치 글 제목이 있는 특정 선택자들 (우선순위 순서)
      title = $('.post_title, .article_title, h1.title, .post-header h1, .article-header h1, .post-title, .article-title, .content-title, h1.post-title, h1.article-title').first().text().trim() || '';
    }
    
    if (!description) {
      // 브런치 글 요약이나 첫 번째 문단 (더 구체적인 선택자들)
      description = $('.post_summary, .article_summary, .post-content p, .article-content p, .content-summary, .post-description, .article-description, .content-description, .post-excerpt, .article-excerpt').first().text().trim() || '';
    }
    
    // 4. 브런치 사이트의 JSON-LD 스크립트에서 추출
    if (!title || !description) {
      $('script[type="application/ld+json"]').each((i, el) => {
        try {
          const jsonData = JSON.parse($(el).html() || '{}');
          if (jsonData['@type'] === 'Article' || jsonData['@type'] === 'BlogPosting') {
            if (!title && jsonData.headline) {
              title = jsonData.headline;
            }
            if (!description && jsonData.description) {
              description = jsonData.description;
            }
          }
        } catch (e) {
          // JSON 파싱 실패 시 무시
        }
      });
    }
    
    // 5. 브런치 사이트의 특정 클래스나 ID에서 추출
    if (!title) {
      title = $('[class*="title"], [class*="Title"], [id*="title"], [id*="Title"]').first().text().trim() || '';
    }
    
    if (!description) {
      description = $('[class*="summary"], [class*="Summary"], [class*="description"], [class*="Description"], [class*="excerpt"], [class*="Excerpt"]').first().text().trim() || '';
    }
    
    // 6. 최종 fallback
    if (!title) {
      title = $('title').text().trim() || '';
    }
    
    // 브런치 사이트에서 불필요한 접미사 제거
    if (title.includes(' - 브런치')) {
      title = title.replace(' - 브런치', '').trim();
    }
    if (title.includes(' | 브런치')) {
      title = title.replace(' | 브런치', '').trim();
    }
    
    // 설명이 너무 길면 자르기 (200자 제한)
    if (description && description.length > 200) {
      description = description.substring(0, 200) + '...';
    }
    
    clearTimeout(timeoutId);
    return { title, description };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// 일반 사이트용 OG 메타데이터 추출 함수
async function extractOGMetadata(url: string): Promise<{ title: string; description: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    // OG 메타데이터 우선 추출
    const title = $('meta[property="og:title"]').attr('content')?.trim() || 
                 $('meta[name="twitter:title"]').attr('content')?.trim() || 
                 $('title').text().trim() || '';
    
    const description = $('meta[property="og:description"]').attr('content')?.trim() || 
                      $('meta[name="twitter:description"]').attr('content')?.trim() || 
                      $('meta[name="description"]').attr('content')?.trim() || '';

    clearTimeout(timeoutId);
    return { title, description };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    // 1. URL 유효성 검사
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Please provide a valid URL' },
        { status: 400 }
      );
    }

    // URL 형식 검증
    let validUrl: URL;
    try {
      validUrl = new URL(url);
      if (!validUrl.protocol.startsWith('http')) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return NextResponse.json(
        { error: 'Please enter a valid URL (e.g., https://example.com)' },
        { status: 400 }
      );
    }

    // 2. 사이트별 메타데이터 추출 시도
    let title = '';
    let description = '';

    try {
      // 브런치 사이트인 경우 전용 함수 사용
      if (url.includes('brunch.co.kr')) {
        const ogData = await extractBrunchMetadata(url);
        title = ogData.title;
        description = ogData.description;
      } else {
        // 일반 사이트는 기존 함수 사용
        const ogData = await extractOGMetadata(url);
        title = ogData.title;
        description = ogData.description;
      }
      
    } catch (fetchError) {
      console.log('❌ 메타데이터 추출 실패, 빈 결과 반환:', fetchError);
      // 웹 스크래핑 실패 시 빈 결과 반환
      title = '';
      description = '';
    }

    // 3. 결과 반환
    const apiResponse: ExtractTitleResponse = {
      title,
      description,
      url
    };

    return NextResponse.json(apiResponse);

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to extract title from URL.' },
      { status: 500 }
    );
  }
} 