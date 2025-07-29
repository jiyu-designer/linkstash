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
      console.log('🔍 Attempting to fetch URL:', url);
      
      // 10초 타임아웃 설정 (브런치 사이트는 로딩이 느릴 수 있음)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      // 다양한 User-Agent와 헤더 조합 시도
      const fetchConfigs = [
        {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          } as Record<string, string>
        },
        {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          } as Record<string, string>
        },
        {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
          } as Record<string, string>
        }
      ];

      let response = null;
      let lastError = null;

      // 여러 설정으로 시도
      for (const config of fetchConfigs) {
        try {
          console.log('🔄 Trying config:', config.userAgent.substring(0, 50) + '...');
          
          response = await fetch(url, {
            signal: controller.signal,
            headers: config.headers
          });

          console.log('📡 Response status:', response.status);
          console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

          if (response.ok) {
            console.log('✅ Successful fetch with config:', config.userAgent.substring(0, 30) + '...');
            break;
          } else {
            console.log('❌ Failed with status:', response.status);
            lastError = new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          console.log('❌ Fetch error with config:', config.userAgent.substring(0, 30) + '...', error);
          lastError = error;
        }
      }

      clearTimeout(timeoutId);

      if (!response || !response.ok) {
        // 브런치 사이트 특별 처리
        if (url.includes('brunch.co.kr')) {
          console.log('🔄 Brunch site detected, using fallback title extraction');
          
          // 브런치 사이트의 경우 기본 제목 생성
          const urlParts = url.split('/');
          const author = urlParts[urlParts.length - 2]?.replace('@', '') || 'Unknown';
          const postId = urlParts[urlParts.length - 1] || 'Unknown';
          
          title = `브런치 - ${author}의 글 (${postId})`;
          description = '브런치에서 공유된 글입니다.';
          
          console.log('📝 Generated fallback title for Brunch:', title);
          
          const apiResponse: ExtractTitleResponse = {
            title,
            description,
            url
          };
          
          return NextResponse.json(apiResponse);
        }
        
        throw lastError || new Error('All fetch attempts failed');
      }

      const html = await response.text();
      console.log('📄 HTML length:', html.length);
      console.log('📄 HTML preview:', html.substring(0, 200) + '...');

      const $ = cheerio.load(html);

      // title 태그에서 제목 추출
      title = $('title').text().trim();
      console.log('📝 Extracted title:', title);
      
      // meta description에서 설명 추출
      description = $('meta[name="description"]').attr('content')?.trim() || '';
      console.log('📝 Extracted description:', description);
      
      // title이 없으면 h1 태그에서 추출 시도
      if (!title) {
        title = $('h1').first().text().trim();
        console.log('📝 Fallback h1 title:', title);
      }
      
      // 여전히 title이 없으면 URL을 제목으로 사용
      if (!title) {
        title = validUrl.hostname;
        console.log('📝 Using hostname as title:', title);
      }

    } catch (fetchError) {
      console.error('❌ Web scraping error:', fetchError);
      
      // 브런치 사이트 특별 처리
      if (url.includes('brunch.co.kr')) {
        console.log('🔄 Brunch site error, using fallback title extraction');
        
        const urlParts = url.split('/');
        const author = urlParts[urlParts.length - 2]?.replace('@', '') || 'Unknown';
        const postId = urlParts[urlParts.length - 1] || 'Unknown';
        
        title = `브런치 - ${author}의 글 (${postId})`;
        description = '브런치에서 공유된 글입니다.';
        
        const apiResponse: ExtractTitleResponse = {
          title,
          description,
          url
        };
        
        return NextResponse.json(apiResponse);
      }
      
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

    console.log('✅ Title extraction response:', JSON.stringify(apiResponse, null, 2));
    return NextResponse.json(apiResponse);

  } catch (error) {
    console.error('❌ Extract title error:', error);
    return NextResponse.json(
      { error: 'Failed to extract title from URL.' },
      { status: 500 }
    );
  }
} 