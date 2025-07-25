import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  try {
    console.log('Testing Gemini API...');
    console.log('API Key present:', !!process.env.GOOGLE_API_KEY);
    console.log('API Key first 10 chars:', process.env.GOOGLE_API_KEY?.substring(0, 10));

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ error: 'API key missing' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "Say hello in one word.";
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ 
      success: true, 
      response: text,
      apiKey: 'Present',
      model: 'gemini-1.5-flash'
    });

  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 