import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface CategorizeResponse {
  category: string;
  tags: string[];
  title: string;
  description?: string;
  url: string;
}

// OG 메타데이터를 활용한 태그 생성
function generateFallbackTagsFromOG(title: string, description?: string, url?: string): string[] {
  const fallbackTags: string[] = [];
  const text = `${title} ${description || ''}`.toLowerCase();
  
  // 한국어 키워드 기반 태그 생성
  const koreanKeywords = {
    '기술': 'technology',
    '개발': 'development',
    '프로그래밍': 'programming',
    '코딩': 'coding',
    '비즈니스': 'business',
    '창업': 'startup',
    '마케팅': 'marketing',
    '디자인': 'design',
    'UI': 'ui',
    'UX': 'ux',
    '교육': 'education',
    '학습': 'learning',
    '강의': 'tutorial',
    '엔터테인먼트': 'entertainment',
    '게임': 'game',
    '영화': 'movie',
    '음악': 'music',
    '건강': 'health',
    '운동': 'fitness',
    '의학': 'medical',
    '라이프스타일': 'lifestyle',
    '취미': 'hobby',
    '여행': 'travel',
    '음식': 'food',
    '뉴스': 'news',
    '정치': 'politics',
    '사회': 'society',
    '블로그': 'blog',
    '글쓰기': 'writing',
    '독서': 'reading',
    '책': 'book',
    '리뷰': 'review',
    '경험': 'experience',
    '일상': 'daily',
    '생각': 'thought',
    '인사이트': 'insight',
    '팁': 'tip',
    '가이드': 'guide',
    '튜토리얼': 'tutorial',
    '하우투': 'howto'
  };

  // 한국어 키워드 매칭
  for (const [korean, english] of Object.entries(koreanKeywords)) {
    if (text.includes(korean)) {
      fallbackTags.push(english);
    }
  }

  // 영어 키워드 기반 태그 생성
  const englishKeywords = [
    'javascript', 'react', 'vue', 'angular', 'node', 'python', 'java', 'php', 'css', 'html', 'api', 'database', 'mobile', 'web',
    'startup', 'entrepreneur', 'marketing', 'seo', 'business', 'strategy', 'product', 'management',
    'design', 'ui', 'ux', 'figma', 'adobe', 'photoshop',
    'tutorial', 'guide', 'how to', 'learn', 'education',
    'game', 'movie', 'music', 'entertainment',
    'health', 'fitness', 'medical', 'exercise',
    'lifestyle', 'hobby', 'travel', 'food',
    'news', 'politics', 'society',
    'blog', 'writing', 'reading', 'book', 'review', 'experience', 'daily', 'thought', 'insight', 'tip', 'guide', 'tutorial', 'howto'
  ];

  for (const keyword of englishKeywords) {
    if (text.includes(keyword)) {
      fallbackTags.push(keyword);
    }
  }

  // URL 기반 태그 추가
  if (url) {
    const urlLower = url.toLowerCase();
    if (urlLower.includes('github.com')) fallbackTags.push('github');
    if (urlLower.includes('stackoverflow.com')) fallbackTags.push('stackoverflow');
    if (urlLower.includes('medium.com')) fallbackTags.push('medium');
    if (urlLower.includes('dev.to')) fallbackTags.push('devto');
    if (urlLower.includes('brunch.co.kr')) fallbackTags.push('brunch');
    if (urlLower.includes('velog.io')) fallbackTags.push('velog');
    if (urlLower.includes('tistory.com')) fallbackTags.push('tistory');
    if (urlLower.includes('naver.com')) fallbackTags.push('naver');
    if (urlLower.includes('daum.net')) fallbackTags.push('daum');
  }

  // 중복 제거 및 정리
  const uniqueTags = [...new Set(fallbackTags)];
  
  // 의미있는 단어 추출 (2글자 이상)
  const words = text.split(/\s+/).filter(word => word.length >= 2);
  if (words.length > 0) {
    // Take up to 2 meaningful words
    uniqueTags.push(...words.slice(0, 2));
  }
  
  // Return 1-3 tags maximum, ensure they're clean
  return uniqueTags.slice(0, 3).map(tag => tag.trim().toLowerCase());
}

// OG 메타데이터를 활용한 카테고리 분류
function categorizeFromOG(title: string, description?: string, url?: string): string {
  const text = `${title} ${description || ''}`.toLowerCase();
  
  // Technology
  if (text.match(/\b(javascript|react|vue|angular|node|python|java|php|css|html|api|database|mobile|web|코딩|프로그래밍|개발|기술)\b/)) {
    return 'Technology';
  }
  
  // Business
  if (text.match(/\b(startup|entrepreneur|marketing|seo|business|strategy|product|management|비즈니스|창업|스타트업|마케팅)\b/)) {
    return 'Business';
  }
  
  // Design
  if (text.match(/\b(design|ui|ux|figma|adobe|photoshop|디자인)\b/)) {
    return 'Design';
  }
  
  // Education
  if (text.match(/\b(tutorial|guide|how to|learn|education|강의|학습|교육)\b/)) {
    return 'Education';
  }
  
  // Entertainment
  if (text.match(/\b(game|movie|music|entertainment|게임|영화|음악)\b/)) {
    return 'Entertainment';
  }
  
  // Health
  if (text.match(/\b(health|fitness|medical|exercise|건강|운동|의학)\b/)) {
    return 'Health';
  }
  
  // Lifestyle
  if (text.match(/\b(lifestyle|hobby|travel|food|라이프스타일|취미|여행|음식)\b/)) {
    return 'Lifestyle';
  }
  
  // News
  if (text.match(/\b(news|politics|society|뉴스|정치|사회)\b/)) {
    return 'News';
  }
  
  return 'Other';
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
    let category = 'Other';
    let tags: string[] = [];

    try {
      const ogData = await extractOGMetadata(url);
      title = ogData.title;
      description = ogData.description;
      
      // OG 메타데이터를 활용한 카테고리 및 태그 생성
      category = categorizeFromOG(title, description, url);
      tags = generateFallbackTagsFromOG(title, description, url);
      
    } catch (fetchError) {
      console.log('❌ 메타데이터 추출 실패, 빈 결과 반환:', fetchError);
      // 웹 스크래핑 실패 시 빈 결과 반환
      title = '';
      description = '';
      category = 'Other';
      tags = [];
    }

    // 3. AI를 사용한 추가 분류 (선택적)
    if (process.env.GOOGLE_API_KEY && title && description) {
      try {
        const prompt = `다음 웹페이지의 제목과 설명을 바탕으로 적절한 카테고리와 태그를 추천해주세요.

제목: ${title}
설명: ${description}
URL: ${url}

다음 카테고리 중에서 선택해주세요:
- Technology (기술, 프로그래밍, IT)
- Business (비즈니스, 마케팅, 경제)
- Design (디자인, UI/UX, 그래픽)
- Education (교육, 학습, 강의)
- Entertainment (엔터테인먼트, 게임, 영화)
- Health (건강, 운동, 의학)
- Lifestyle (라이프스타일, 취미, 여행)
- News (뉴스, 정치, 사회)
- Other (기타)

태그는 3-5개의 관련 키워드를 영어로 제공해주세요.

응답 형식:
카테고리: [카테고리명]
태그: [태그1, 태그2, 태그3]`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          // AI 응답에서 카테고리와 태그 추출
          const categoryMatch = aiResponse.match(/카테고리:\s*([^\n]+)/);
          const tagsMatch = aiResponse.match(/태그:\s*\[([^\]]+)\]/);
          
          if (categoryMatch && categoryMatch[1]) {
            const aiCategory = categoryMatch[1].trim();
            if (['Technology', 'Business', 'Design', 'Education', 'Entertainment', 'Health', 'Lifestyle', 'News', 'Other'].includes(aiCategory)) {
              category = aiCategory;
            }
          }
          
          if (tagsMatch && tagsMatch[1]) {
            const aiTags = tagsMatch[1].split(',').map((tag: string) => tag.trim().toLowerCase());
            if (aiTags.length > 0) {
              tags = aiTags.slice(0, 5); // 최대 5개 태그
            }
          }
        }
      } catch (aiError) {
        console.log('❌ AI 분류 실패:', aiError);
        // AI 분류 실패 시 기존 결과 유지
      }
    }

    // 4. 응답 반환
    return NextResponse.json({
      category,
      tags,
      title,
      description,
      url
    } as CategorizeResponse);

  } catch (error) {
    console.error('❌ categorize API 오류:', error);
    return NextResponse.json(
      { error: 'Failed to categorize URL' },
      { status: 500 }
    );
  }
} 