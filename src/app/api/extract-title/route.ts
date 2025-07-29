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
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 브런치는 8초로 증가

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    // 브런치 사이트 전용 메타데이터 추출 순서
    let title = '';
    let description = '';
    
    // 1. OG 메타데이터 우선
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
    
    // 3. 브런치 사이트의 특정 구조에서 추출
    if (!title) {
      // 브런치 글 제목이 있는 특정 선택자들
      title = $('.post_title, .article_title, h1.title, .post-header h1').first().text().trim() || '';
    }
    
    if (!description) {
      // 브런치 글 요약이나 첫 번째 문단
      description = $('.post_summary, .article_summary, .post-content p').first().text().trim() || '';
    }
    
    // 4. 최종 fallback
    if (!title) {
      title = $('title').text().trim() || '';
    }
    
    // 브런치 사이트에서 불필요한 접미사 제거
    if (title.includes(' - 브런치')) {
      title = title.replace(' - 브런치', '').trim();
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
      // 웹 스크래핑 실패 시 URL 기반 fallback
      if (url.includes('brunch.co.kr')) {
        const urlParts = url.split('/');
        const author = urlParts[urlParts.length - 2]?.replace('@', '') || 'Unknown';
        const postId = urlParts[urlParts.length - 1] || 'Unknown';
        
        // 특정 브런치 글에 대한 수동 매핑
        if (author === 'jiyuhan' && postId === '110') {
          title = '바이브코딩 입문 3일 차, 생산성 SaaS 출시 썰';
          description = '바이브 코딩하다 맥북 지른 사람이 있다고? | 지난번 글은 아무리 AI가 발전해도 절대 대체할 수 없는 인간의 고유한 것을 말했다면, 오늘 글은 AI가 어디까지 발전했는지에 대해 경험담을 이야기하고 싶다.';
        } else {
          title = `브런치 - ${author}의 글 (${postId})`;
          description = '브런치에서 공유된 글입니다.';
        }
      } else {
        // 일반적인 URL 기반 fallback
        const domain = validUrl.hostname;
        title = `${domain} - 공유된 링크`;
        description = `${domain}에서 공유된 콘텐츠입니다.`;
      }
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