import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { database } from '@/lib/database';

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
      const prompt = `Analyze this webpage and categorize it with specific, actionable tags:

Title: ${title}
Description: ${description || title}
URL: ${validUrl.hostname}

Respond with ONLY a valid JSON object:
{
  "category": "Technology",
  "tags": ["react", "frontend", "tutorial"]
}

CATEGORY OPTIONS (choose the most specific):
- Technology (programming, software, development, tools)
- Design (UI/UX, graphics, branding, creative)
- Business (marketing, startup, strategy, management)
- Productivity (workflow, organization, efficiency)
- Other (everything else)

TAG REQUIREMENTS:
- Extract 1-3 SPECIFIC, USEFUL keywords from the content
- Use concrete terms like: "react", "javascript", "marketing", "figma", "startup"
- Focus on technologies, tools, skills, or specific topics mentioned
- NO generic words like: "general", "article", "content", "guide", "tips", "best"
- Make tags searchable and meaningful for organizing bookmarks
- Use lowercase, replace spaces with hyphens (e.g., "machine-learning")

Examples of good tags:
- Technology: ["javascript", "react", "api-design"]
- Design: ["figma", "ui-design", "typography"] 
- Business: ["startup", "marketing", "product-management"]

Respond with valid JSON only.`;

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const geminiResult = await model.generateContent(prompt);
      const response = await geminiResult.response;
      
      let category = 'Other';
      let tags: string[] = [];
      
      try {
        const responseText = response.text().trim();
        console.log('Gemini raw response:', responseText);
        
        // Clean up the response text - remove markdown code blocks if present
        const cleanedText = responseText.replace(/```json\s*|\s*```/g, '').trim();
        
        const jsonResponse = JSON.parse(cleanedText);
        category = jsonResponse.category || 'Other';
        tags = Array.isArray(jsonResponse.tags) ? jsonResponse.tags.filter((tag: string) => tag && tag.trim()) : [];
        
        // Clean and format tags
        tags = tags.map((tag: string) => tag.toLowerCase().trim().replace(/\s+/g, '-')).slice(0, 3);
        
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

      // Ensure we have at least one tag
      if (tags.length === 0) {
        const fallbackTags = generateFallbackTags(title, description);
        tags = fallbackTags.length > 0 ? fallbackTags : ['bookmark'];
      }

      // 4. 자동으로 카테고리와 태그를 데이터베이스에 생성
      try {
        await database.autoCreateCategoryAndTags(category, tags);
        console.log('Successfully auto-created category and tags:', { category, tags });
      } catch (dbError) {
        console.error('Error auto-creating category and tags:', dbError);
        // Continue even if auto-creation fails
      }

      // 5. 결과 반환
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
      
      // Fallback to local categorization if AI fails
      const fallbackTags = generateFallbackTags(title, description);
      let fallbackCategory = 'Other';
      
      // Simple category detection based on common keywords
      const fullText = `${title} ${description}`.toLowerCase();
      if (fullText.match(/\b(code|programming|development|software|app|web|javascript|python|react|api|database|tech)\b/)) {
        fallbackCategory = 'Technology';
      } else if (fullText.match(/\b(design|ui|ux|figma|adobe|creative|brand|logo|visual)\b/)) {
        fallbackCategory = 'Design';
      } else if (fullText.match(/\b(business|startup|marketing|strategy|management|sales|entrepreneur)\b/)) {
        fallbackCategory = 'Business';
      } else if (fullText.match(/\b(productivity|workflow|organization|tool|efficiency|tips)\b/)) {
        fallbackCategory = 'Productivity';
      }
      
      const fallbackResponse: CategorizeResponse = {
        category: fallbackCategory,
        tags: fallbackTags.length > 0 ? fallbackTags : ['bookmark'],
        title,
        description,
        url
      };
      
      // Try to auto-create even in fallback case
      try {
        await database.autoCreateCategoryAndTags(fallbackCategory, fallbackResponse.tags);
      } catch (dbError) {
        console.error('Error auto-creating fallback category and tags:', dbError);
      }
      
      console.log('Using fallback response:', JSON.stringify(fallbackResponse, null, 2));
      return NextResponse.json(fallbackResponse);
    }

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 