# LinkStash 🔗

LinkStash is an AI-powered URL categorization tool that automatically classifies web links using advanced language models. Simply paste any URL and get instant categorization with extracted metadata.

## ✨ Features

- **Smart URL Categorization**: AI-powered classification into Technology, Design, Business, Productivity, and Other categories
- **Web Scraping**: Automatic extraction of page titles and descriptions
- **Real-time Processing**: Fast categorization with loading states and error handling
- **Responsive Design**: Beautiful UI that works on all devices
- **TypeScript**: Fully typed for better development experience

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Google API Key (for Gemini)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd linkstash
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Add your API keys to `.env.local`:
```bash
# Required: Google API key for Gemini
GOOGLE_API_KEY=your_google_api_key_here

# Optional: Supabase configuration (if not provided, localStorage will be used)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Run the development server:
5. (Optional) Set up Supabase Database:
   
   If you want to use a persistent database instead of localStorage:
   
   a. Create a new project at [supabase.com](https://supabase.com)
   
   b. Run the SQL script from `database/schema.sql` in your Supabase SQL editor
   
   c. Add your Supabase URL and anon key to `.env.local`
   
   **Note**: If Supabase is not configured, the app will automatically use localStorage as a fallback.

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI**: Google Gemini API
- **Web Scraping**: Cheerio
- **Database**: Supabase (PostgreSQL) with localStorage fallback
- **Styling**: Tailwind CSS

## 📁 Project Structure

```
linkstash/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── categorize/
│   │   │       └── route.ts      # API endpoint for URL categorization
│   │   ├── globals.css           # Global styles
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Main page component
│   └── types/                    # TypeScript type definitions
├── public/                       # Static assets
├── .env.example                  # Environment variables template
└── README.md
```

## 🔧 API Usage

### POST /api/categorize

Categorizes a URL and returns metadata.

**Request:**
```json
{
  "url": "https://example.com/article"
}
```

**Response:**
```json
{
  "category": "Technology",
  "title": "Article Title",
  "url": "https://example.com/article"
}
```

**Error Response:**
```json
{
  "error": "Error message"
}
```

## 🚦 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_API_KEY` | Your Google API key for Gemini | ✅ |

## 🧪 Testing

Run the development server and test with various URLs:

1. Technology sites (e.g., TechCrunch, Hacker News)
2. Design sites (e.g., Dribbble, Behance)
3. Business sites (e.g., Forbes, Harvard Business Review)
4. Productivity sites (e.g., Notion, productivity blogs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🔮 Future Features

- User authentication and saved links
- Browser extension
- Custom categories
- Bulk URL processing
- Analytics dashboard

---

Built with ❤️ using Next.js and Google Gemini
