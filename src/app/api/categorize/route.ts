import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Google Gemini 클라이언트 초기화
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

interface CategorizeResponse {
  category: string;
  tags: string[];
  title: string;
  description?: string;
  url: string;
}

// Generate fallback tags based on title and description keywords
function generateFallbackTags(title: string, description?: string): string[] {
  const text = `${title} ${description || ''}`.toLowerCase();
  const fallbackTags: string[] = [];
  
  // Technology keywords
  if (text.match(/\b(javascript|js|react|vue|angular|node|python|java|php|css|html|api|database|sql|web|mobile|app|software|code|programming|developer|framework|library)\b/)) {
    fallbackTags.push('web development');
  }
  if (text.match(/\b(ai|artificial intelligence|machine learning|ml|deep learning|neural|algorithm|data science|automation)\b/)) {
    fallbackTags.push('artificial intelligence');
  }
  if (text.match(/\b(cloud|aws|azure|docker|kubernetes|devops|deployment|server|hosting)\b/)) {
    fallbackTags.push('cloud computing');
  }
  
  // Design keywords
  if (text.match(/\b(design|ui|ux|interface|user experience|figma|sketch|adobe|photoshop|typography|color|layout)\b/)) {
    fallbackTags.push('design');
  }
  if (text.match(/\b(brand|branding|logo|identity|visual|graphic|creative)\b/)) {
    fallbackTags.push('branding');
  }
  
  // Business keywords
  if (text.match(/\b(startup|entrepreneur|business|company|strategy|marketing|sales|revenue|growth|investment)\b/)) {
    fallbackTags.push('business strategy');
  }
  if (text.match(/\b(product|management|project|team|leadership|agile|scrum)\b/)) {
    fallbackTags.push('product management');
  }
  
  // Productivity keywords
  if (text.match(/\b(productivity|time|efficiency|workflow|automation|tool|tips|organization|planning)\b/)) {
    fallbackTags.push('productivity');
  }
  if (text.match(/\b(tutorial|guide|how to|learn|education|course|training)\b/)) {
    fallbackTags.push('learning');
  }
  
  // If no specific tags found, extract meaningful words from title
  if (fallbackTags.length === 0) {
    const words = title.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !['the', 'and', 'for', 'with', 'this', 'that', 'from', 'they', 'have', 'will', 'your', 'what', 'when', 'where', 'how'].includes(word));
    
    if (words.length > 0) {
      fallbackTags.push(words[0]);
    }
  }
  
  // Return 1-3 tags maximum
  return fallbackTags.slice(0, 3);
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

    // 3. Google Gemini API 호출로 카테고리 분류
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'Categorization service is not configured.' },
        { status: 500 }
      );
    }

    try {
              const prompt = `Please analyze this webpage and categorize it:

Title: ${title}
Description: ${description || title}

You must respond with ONLY a valid JSON object like this:
{
  "category": "Technology",
  "tags": ["javascript", "tutorial"]
}

Category options: Technology, Design, Business, Productivity, Other

For tags:
- Include 1-3 specific keywords from the content
- Use simple words like: "javascript", "react", "design", "marketing", "startup"
- NO generic words like "general", "article", "content"

Response must be valid JSON only.`;

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const geminiResult = await model.generateContent(prompt);
      const response = await geminiResult.response;
      
      let category = 'Other';
      let tags: string[] = [];
      
      try {
        const responseText = response.text().trim();
        console.log('Gemini raw response:', responseText);
        
        const jsonResponse = JSON.parse(responseText);
        category = jsonResponse.category || 'Other';
        tags = Array.isArray(jsonResponse.tags) ? jsonResponse.tags : [];
        
        console.log('Parsed category:', category);
        console.log('Parsed tags:', tags);
                        } catch (parseError) {
          // Fallback if JSON parsing fails
          console.log('JSON parsing failed, using fallback logic');
          console.log('Parse error:', parseError);
          
          const text = response.text().trim();
          console.log('Raw response for fallback:', text);
          
          if (text.includes('Technology')) category = 'Technology';
          else if (text.includes('Design')) category = 'Design';
          else if (text.includes('Business')) category = 'Business';
          else if (text.includes('Productivity')) category = 'Productivity';
          
          // Generate fallback tags based on title keywords
          const fallbackTags = generateFallbackTags(title, description);
          tags = fallbackTags;
          
          console.log('Fallback category:', category);
          console.log('Fallback tags:', tags);
        }

      // 4. 결과 반환
      const apiResponse: CategorizeResponse = {
        category,
        tags,
        title,
        description,
        url
      };

      console.log('Final API response:', JSON.stringify(apiResponse, null, 2));
      return NextResponse.json(apiResponse);

    } catch (geminiError) {
      console.error('Gemini API error:', geminiError);
      console.error('Error details:', {
        message: geminiError instanceof Error ? geminiError.message : 'Unknown error',
        stack: geminiError instanceof Error ? geminiError.stack : undefined,
        apiKey: process.env.GOOGLE_API_KEY ? 'Present' : 'Missing'
      });
      return NextResponse.json(
        { error: 'Categorization service is temporarily unavailable. Please try again later.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 