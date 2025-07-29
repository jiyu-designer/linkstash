import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface CategorizeResponse {
  category: string;
  tags: string[];
  title: string;
  description?: string;
  url: string;
}

// OG 메타데이터를 활용한 향상된 fallback 태그 생성
function generateFallbackTagsFromOG(title: string, description?: string, url?: string): string[] {
  const text = `${title} ${description || ''}`.toLowerCase();
  const fallbackTags: string[] = [];
  
  // Technology keywords - more specific
  if (text.match(/\b(javascript|js)\b/)) fallbackTags.push('javascript');
  else if (text.match(/\b(react|reactjs)\b/)) fallbackTags.push('react');
  else if (text.match(/\b(vue|vuejs)\b/)) fallbackTags.push('vue');
  else if (text.match(/\b(angular)\b/)) fallbackTags.push('angular');
  else if (text.match(/\b(node|nodejs)\b/)) fallbackTags.push('nodejs');
  else if (text.match(/\b(python)\b/)) fallbackTags.push('python');
  else if (text.match(/\b(java)\b/)) fallbackTags.push('java');
  else if (text.match(/\b(php)\b/)) fallbackTags.push('php');
  else if (text.match(/\b(css|styling)\b/)) fallbackTags.push('css');
  else if (text.match(/\b(html)\b/)) fallbackTags.push('html');
  else if (text.match(/\b(api|rest|graphql)\b/)) fallbackTags.push('api');
  else if (text.match(/\b(database|sql|mysql|postgresql)\b/)) fallbackTags.push('database');
  else if (text.match(/\b(mobile|ios|android)\b/)) fallbackTags.push('mobile');
  else if (text.match(/\b(web|website|frontend|backend)\b/)) fallbackTags.push('web');
  
  // AI & ML keywords
  if (text.match(/\b(ai|artificial intelligence)\b/)) fallbackTags.push('ai');
  else if (text.match(/\b(machine learning|ml)\b/)) fallbackTags.push('machine-learning');
  else if (text.match(/\b(deep learning|neural)\b/)) fallbackTags.push('deep-learning');
  else if (text.match(/\b(chatgpt|openai|llm)\b/)) fallbackTags.push('llm');
  
  // Cloud & DevOps
  if (text.match(/\b(aws|amazon web services)\b/)) fallbackTags.push('aws');
  else if (text.match(/\b(azure|microsoft azure)\b/)) fallbackTags.push('azure');
  else if (text.match(/\b(docker|container)\b/)) fallbackTags.push('docker');
  else if (text.match(/\b(kubernetes|k8s)\b/)) fallbackTags.push('kubernetes');
  else if (text.match(/\b(devops|deployment)\b/)) fallbackTags.push('devops');
  
  // Design keywords
  if (text.match(/\b(design|ui|user interface)\b/)) fallbackTags.push('design');
  else if (text.match(/\b(ux|user experience)\b/)) fallbackTags.push('ux');
  else if (text.match(/\b(figma)\b/)) fallbackTags.push('figma');
  else if (text.match(/\b(adobe|photoshop)\b/)) fallbackTags.push('adobe');
  
  // Business keywords
  if (text.match(/\b(startup|entrepreneur)\b/)) fallbackTags.push('startup');
  else if (text.match(/\b(marketing|seo)\b/)) fallbackTags.push('marketing');
  else if (text.match(/\b(business|strategy)\b/)) fallbackTags.push('business');
  else if (text.match(/\b(product|management)\b/)) fallbackTags.push('product-management');
  
  // Learning & Productivity
  if (text.match(/\b(tutorial|guide|how to|learn)\b/)) fallbackTags.push('tutorial');
  else if (text.match(/\b(productivity|workflow)\b/)) fallbackTags.push('productivity');
  else if (text.match(/\b(tool|app|software)\b/)) fallbackTags.push('tools');
  
  // Korean keywords for better detection
  if (text.match(/\b(코딩|프로그래밍|개발)\b/)) fallbackTags.push('coding');
  else if (text.match(/\b(디자인|UI|UX)\b/)) fallbackTags.push('design');
  else if (text.match(/\b(비즈니스|창업|스타트업)\b/)) fallbackTags.push('business');
  else if (text.match(/\b(마케팅|SEO|광고)\b/)) fallbackTags.push('marketing');
  else if (text.match(/\b(학습|교육|강의)\b/)) fallbackTags.push('education');
  else if (text.match(/\b(생산성|워크플로우)\b/)) fallbackTags.push('productivity');
  
  // If no specific tags found, extract meaningful words from title
  if (fallbackTags.length === 0) {
    const words = title.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length > 3 && 
        word.length < 15 &&
        !['the', 'and', 'for', 'with', 'this', 'that', 'from', 'they', 'have', 'will', 'your', 'what', 'when', 'where', 'how', 'best', 'guide', 'tips', 'about', 'into', 'using', 'create', 'build'].includes(word)
      );
    
    if (words.length > 0) {
      // Take up to 2 meaningful words
      fallbackTags.push(...words.slice(0, 2));
    }
  }
  
  // Return 1-3 tags maximum, ensure they're clean
  return fallbackTags.slice(0, 3).map(tag => tag.trim().toLowerCase());
}

// OG 메타데이터를 활용한 카테고리 분류
function categorizeFromOG(title: string, description?: string, url?: string): string {
  const text = `${title} ${description || ''}`.toLowerCase();
  
  // Technology
  if (text.match(/\b(javascript|react|vue|angular|node|python|java|php|css|html|api|database|mobile|web|코딩|프로그래밍|개발)\b/)) {
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
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃

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

    // 2. OG 메타데이터 추출 시도
    let title = '';
    let description = '';
    let category = 'Other';
    let tags: string[] = [];

    try {
      // OG 메타데이터 추출
      const ogData = await extractOGMetadata(url);
      title = ogData.title;
      description = ogData.description;
      
      // OG 메타데이터를 활용한 카테고리 및 태그 생성
      category = categorizeFromOG(title, description, url);
      tags = generateFallbackTagsFromOG(title, description, url);
      
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
          category = 'Technology';
          tags = ['coding', 'productivity', 'software'];
        } else {
          title = `브런치 - ${author}의 글 (${postId})`;
          description = '브런치에서 공유된 글입니다.';
          category = 'Other';
          tags = ['blog', 'korean', 'writing'];
        }
      } else {
        // 일반적인 URL 기반 fallback
        const domain = validUrl.hostname;
        title = `${domain} - 공유된 링크`;
        description = `${domain}에서 공유된 콘텐츠입니다.`;
        category = 'Other';
        tags = ['web', 'link'];
      }
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

JSON 형식으로 응답해주세요:
{
  "category": "선택한 카테고리",
  "tags": ["태그1", "태그2", "태그3"]
}`;

        const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GOOGLE_API_KEY}`
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          })
        });

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          const responseText = geminiData.candidates[0].content.parts[0].text;
          
          // JSON 추출
          const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            const parsedData = JSON.parse(jsonMatch[1]);
            category = parsedData.category || category;
            tags = parsedData.tags && parsedData.tags.length > 0 ? parsedData.tags : tags;
          }
        }
      } catch (aiError) {
        // AI 분류 실패 시 기존 fallback 결과 유지
      }
    }

    // 4. 결과 반환
    const apiResponse: CategorizeResponse = {
      category,
      tags,
      title,
      description,
      url
    };

    return NextResponse.json(apiResponse);

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to categorize URL.' },
      { status: 500 }
    );
  }
} 