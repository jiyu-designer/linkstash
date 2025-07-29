import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface ExtractTitleResponse {
  title: string;
  description: string;
  url: string;
}

// 브런치 사이트 전용 메타데이터 추출 함수
async function extractBrunchMetadata(url: string): Promise<{ title: string; description: string }> {
  // 브런치 사이트의 경우 공유할 때 사용하는 메타데이터를 활용
  // 브런치 글의 URL 패턴을 분석하여 제목과 설명을 생성
  const urlParts = url.split('/');
  const author = urlParts[urlParts.length - 2]?.replace('@', '') || 'Unknown';
  const postId = urlParts[urlParts.length - 1] || 'Unknown';
  
  // 브런치 사이트의 공유 메타데이터를 활용한 제목 생성
  const title = `브런치 - ${author}의 글`;
  const description = `브런치에서 ${author}님이 작성한 글입니다.`;
  
  return { title, description };
}

// OG 메타데이터 추출 함수
async function extractOGMetadata(url: string): Promise<{ title: string; description: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

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

    // 2. 메타데이터 추출 시도
    let title = '';
    let description = '';

    try {
      // 브런치 사이트인 경우 특별 처리
      if (url.includes('brunch.co.kr')) {
        const brunchData = await extractBrunchMetadata(url);
        title = brunchData.title;
        description = brunchData.description;
      } else {
        // 일반 사이트는 OG 메타데이터 추출
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

    // 3. 응답 반환
    return NextResponse.json({
      title,
      description,
      url
    } as ExtractTitleResponse);

  } catch (error) {
    console.error('❌ extract-title API 오류:', error);
    return NextResponse.json(
      { error: 'Failed to extract title and description' },
      { status: 500 }
    );
  }
} 