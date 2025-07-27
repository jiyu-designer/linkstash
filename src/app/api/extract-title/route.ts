import * as cheerio from 'cheerio';
import { NextRequest, NextResponse } from 'next/server';

interface ExtractTitleResponse {
  title: string;
  description?: string;
  url: string;
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

    // 2. 웹 스크래핑으로 메타데이터 추출
    let title = '';
    let description = '';

    try {
      // 5초 타임아웃 설정
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // title 태그에서 제목 추출
      title = $('title').text().trim();
      
      // meta description에서 설명 추출
      description = $('meta[name="description"]').attr('content')?.trim() || '';
      
      // title이 없으면 h1 태그에서 추출 시도
      if (!title) {
        title = $('h1').first().text().trim();
      }
      
      // 여전히 title이 없으면 URL을 제목으로 사용
      if (!title) {
        title = validUrl.hostname;
      }

    } catch (fetchError) {
      console.error('Web scraping error:', fetchError);
      return NextResponse.json(
        { error: 'Could not retrieve content from the URL.' },
        { status: 400 }
      );
    }

    // 3. 결과 반환 (AI 태깅 없이)
    const apiResponse: ExtractTitleResponse = {
      title,
      description,
      url
    };

    console.log('Title extraction response:', JSON.stringify(apiResponse, null, 2));
    return NextResponse.json(apiResponse);

  } catch (error) {
    console.error('Extract title error:', error);
    return NextResponse.json(
      { error: 'Failed to extract title from URL.' },
      { status: 500 }
    );
  }
} 