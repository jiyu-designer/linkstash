import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  try {
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000000',
            backgroundImage: 'linear-gradient(135deg, #000000 0%, #0f0f0f 50%, #1a1a1a 100%)',
          }}
        >
          <div
            style={{
              fontSize: '72px',
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: '64px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '-0.025em',
            }}
          >
            LinkStash (by Jiyu)
          </div>
          
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
              fontSize: '52px',
              fontWeight: 500,
              color: '#e5e7eb',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '0.01em',
              lineHeight: 1.2,
            }}
          >
            <div>Save smartly.</div>
            <div>Learn deeply.</div>
          </div>

          <div
            style={{
              width: '80px',
              height: '4px',
              backgroundColor: '#3b82f6',
              borderRadius: '2px',
              marginTop: '64px',
            }}
          />
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