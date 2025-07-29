import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // SVG 파일을 직접 제공
    const svgContent = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <!-- 배경 -->
  <rect width="1200" height="630" fill="#1a1a1a"/>
  
  <!-- 헤더 섹션 -->
  <g transform="translate(40, 40)">
    <!-- 왼쪽: 로고와 제목 -->
    <g transform="translate(0, 0)">
      <!-- 로고 아이콘 -->
      <rect x="0" y="0" width="32" height="32" fill="#3b82f6" rx="6"/>
      <rect x="8" y="8" width="16" height="16" fill="none" stroke="white" stroke-width="2" rx="2"/>
      
      <!-- LinkStash 제목 -->
      <text x="44" y="24" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="700" fill="white">LinkStash</text>
      
      <!-- 태그라인 -->
      <text x="44" y="48" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#9ca3af">Save smartly. Learn deeply.</text>
    </g>
    
    <!-- 오른쪽: 사용자 프로필 -->
    <g transform="translate(1000, 0)">
      <!-- 프로필 아바타 -->
      <circle cx="24" cy="24" r="24" fill="#3b82f6"/>
      <text x="24" y="30" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="600" fill="white" text-anchor="middle">J</text>
      
      <!-- 사용자 정보 -->
      <text x="60" y="20" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="white">Jiyu Han</text>

    </g>
  </g>
  
  <!-- 입력 섹션 -->
  <g transform="translate(40, 120)">
    <!-- 링크 입력 필드 -->
    <rect x="0" y="0" width="600" height="48" fill="#2d2d2d" stroke="#404040" stroke-width="1" rx="8"/>
    <text x="16" y="30" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#9ca3af">Paste a link</text>
    
    <!-- 메모 입력 필드 -->
    <rect x="620" y="0" width="200" height="48" fill="#2d2d2d" stroke="#404040" stroke-width="1" rx="8"/>
    <text x="636" y="30" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#9ca3af">Personal memo (optional)</text>
    
    <!-- AutoStash 버튼 -->
    <rect x="840" y="0" width="120" height="48" fill="#3b82f6" rx="8"/>
    <text x="900" y="30" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="white" text-anchor="middle">AutoStash</text>
  </g>
  
  <!-- 사용량 표시 -->
  <g transform="translate(40, 180)">
    <circle cx="8" cy="8" r="4" fill="#3b82f6"/>
    <text x="20" y="12" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#9ca3af">Daily AutoStash Usage: 7/10</text>
  </g>
  
  <!-- All Links 섹션 -->
  <g transform="translate(40, 220)">
    <!-- 제목 -->
    <text x="0" y="0" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="700" fill="white">All Links</text>
    
    <!-- 필터 버튼들 -->
    <g transform="translate(0, 40)">
      <!-- Category -->
      <text x="0" y="0" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#9ca3af">CATEGORY</text>
      <rect x="0" y="8" width="100" height="24" fill="#2d2d2d" rx="6"/>
      <text x="50" y="24" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="white" text-anchor="middle">All Categories</text>
      
      <!-- Tag -->
      <text x="120" y="0" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#9ca3af">TAG</text>
      <rect x="120" y="8" width="80" height="24" fill="#2d2d2d" rx="6"/>
      <text x="160" y="24" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="white" text-anchor="middle">All Tags</text>
      
      <!-- Read Status -->
      <text x="220" y="0" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#9ca3af">READ STATUS</text>
      <rect x="220" y="8" width="60" height="24" fill="#2d2d2d" rx="6"/>
      <text x="250" y="24" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="white" text-anchor="middle">All</text>
      
      <!-- Sort By -->
      <text x="300" y="0" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#9ca3af">SORT BY</text>
      <rect x="300" y="8" width="120" height="24" fill="#2d2d2d" rx="6"/>
      <text x="360" y="24" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="white" text-anchor="middle">Newest Added</text>
    </g>
    
    <!-- 샘플 링크들 -->
    <g transform="translate(0, 100)">
      <!-- 링크 1 -->
      <g>
        <circle cx="8" cy="8" r="6" fill="none" stroke="#404040" stroke-width="2"/>
        <text x="24" y="12" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="white">'바이브 코딩'이 신입 개발자의 핵심 역량이 된 이유 | 요즘IT</text>
        <text x="24" y="28" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#9ca3af">Technology</text>
        <text x="24" y="42" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#3b82f6">#coding #software-development #career-development</text>
      </g>
      
      <!-- 링크 2 -->
      <g transform="translate(0, 80)">
        <circle cx="8" cy="8" r="6" fill="none" stroke="#404040" stroke-width="2"/>
        <text x="24" y="12" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="white">전문 지식 없이도 웹 기반 UI 뚝딱 생성하는 'HeroUI' | 요즘IT</text>
        <text x="24" y="28" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#9ca3af">Technology</text>
        <text x="24" y="42" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#3b82f6">#react #frontend #ui-design</text>
      </g>
      
      <!-- 링크 3 -->
      <g transform="translate(0, 160)">
        <circle cx="8" cy="8" r="6" fill="none" stroke="#404040" stroke-width="2"/>
        <text x="24" y="12" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="white">취업이 힘들수록 질문하는 사람이 살아남는다 | 요즘IT</text>
        <text x="24" y="28" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#9ca3af">Business</text>
        <text x="24" y="42" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#3b82f6">#career-advice #interview-skills #communication</text>
      </g>
    </g>
  </g>
</svg>
    `;
    
    return new Response(svgContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (e: any) {
    console.log(`Failed to serve OG image: ${e.message}`);
    
    // 폴백: 간단한 텍스트 기반 이미지 생성
    const fallbackImage = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <rect width="1200" height="630" fill="#1a1a1a"/>
        <text x="600" y="315" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle">
          LinkStash - AI-Powered Bookmark Manager
        </text>
        <text x="600" y="365" font-family="Arial, sans-serif" font-size="24" fill="#9ca3af" text-anchor="middle">
          Save smartly. Learn deeply.
        </text>
      </svg>
    `;
    
    return new Response(fallbackImage, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
}

/*
// 기존 이미지 생성 코드 (주석 처리)
import { ImageResponse } from 'next/og';

export async function GET() {
  try {
    return new ImageResponse(
      (
        <div style={{...}}>
          // ... 기존 코드 ...
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`Failed to generate OG image: ${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
*/ 