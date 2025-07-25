# Product Requirements Document: Auto-Tag URL (MVP v1)

## 1. Overview

- **Product Name:** LinkStash (working title)
- **Version:** 1.0 (MVP)
- **Target Agent:** AI Coding Agent (e.g., Cursor, Lovable)
- **Core Goal:** To build a single-page web application that accepts a URL, automatically categorizes it using an LLM, and displays the result. The primary goal is to validate the core value proposition: "is automated URL categorization useful?"

## 2. The Problem

Users, especially knowledge workers like product designers, marketers, and engineers, constantly discover interesting articles and resources online. They intend to read or reference them later but struggle with organization. Existing tools like Raindrop or Notion require manual tagging and categorization, which is a tedious process that often leads to a messy, unusable "digital junkyard."

## 3. The Solution (MVP Scope)

A minimalist web app where a user can paste a URL. The app will scrape the page's metadata, send it to an LLM for categorization, and display the URL, its title, and the AI-generated category in a simple list. This is an ephemeral experience; data is not saved per user in this MVP.

---

## 4. Functional Requirements

### 4.1. Input: URL Submission

- **User Action:** The user pastes a full URL (e.g., `https://www.theverge.com/237...`) into a text input field and clicks a "Categorize" button.
- **System Logic:**
    - The input must be validated to ensure it's a properly formatted URL.
    - On submission, a loading state should be displayed to the user.

### 4.2. Processing: Scrape & Categorize

- **System Logic:**
    1.  **Backend Trigger:** The frontend sends the validated URL to a backend endpoint.
    2.  **Web Scraping:** The backend fetches the content of the URL. It must gracefully handle potential fetch errors (e.g., 404 Not Found, 500 Server Error).
    3.  **Metadata Extraction:** Extract the content of the `<title>` tag and the `content` attribute of the `<meta name="description" content="...">` tag. If the description is missing, use the title alone.
    4.  **LLM API Call:**
        - Construct a prompt for an LLM API (use OpenAI's GPT-4o or Google's Gemini).
        - The prompt should be precise to ensure a consistent output format.
        - ```
          "Analyze the following title and description from a webpage. Classify it into ONE of the following categories: Technology, Design, Business, Productivity, Other. Respond with only the single category name and nothing else.
          
          Title: [Extracted Title]
          Description: [Extracted Description]"
          ```
        - The API call must have a timeout (e.g., 5 seconds) to prevent the user from waiting too long.

### 4.3. Output: Displaying the Result

- **System Logic:**
    - The backend returns a JSON object to the frontend containing: `{ "category": "Technology", "title": "The Extracted Title", "url": "The Original URL" }`.
    - The frontend receives the data and dynamically adds a new row to a results table.
    - The results table should have three columns: `Category`, `Title`, and `URL`.
    - The `URL` column should contain a clickable link that opens the original URL in a new browser tab.

### 4.4. Promotion & Virality Element

- **User Action:** None. This is a passive element.
- **System Logic:**
    - A small, non-intrusive text link shall be present at the bottom of the page.
    - **Text:** "Tired of organizing bookmarks? This page was built with LinkStash. Find out more."
    - This link should point to a simple, temporary landing page (e.g., a Carrd or Notion page) that explains the product's vision and has a sign-up form for updates.

---

## 5. Technical Stack & Implementation Notes

- **Frontend:** React (Next.js is preferred for its API routes feature) with Tailwind CSS for styling.
- **Backend:** Implement the backend logic within Next.js API Routes. This simplifies deployment.
- **Web Scraping:** Use a lightweight library like `cheerio` for server-side HTML parsing.
- **LLM API:** Use the official OpenAI Node.js library. The API key must be managed as an environment variable (`OPENAI_API_KEY`) and should never be exposed on the client-side.

---

## 6. Testing & Validation (for AI Agent)

Generate test code using a framework like Jest and React Testing Library. The tests must cover the following acceptance criteria.

### 6.1. Unit & Integration Tests

- **Scenario 1: Successful Categorization**
    - **Given:** A user enters a valid URL (e.g., `https://techcrunch.com/`).
    - **When:** The "Categorize" button is clicked.
    - **Then:**
        - An API call to the backend is made with the correct URL.
        - The backend correctly calls the LLM API.
        - A new row appears in the results table containing the category 'Technology', the page title, and the URL.

- **Scenario 2: Invalid URL Input**
    - **Given:** A user enters a non-URL string (e.g., `hello world`).
    - **When:** The "Categorize" button is clicked.
    - **Then:**
        - An error message "Please enter a valid URL (e.g., https://example.com)" is displayed near the input field.
        - No API call is made.

- **Scenario 3: Web Scraping Fails**
    - **Given:** A user enters a URL that returns a 404 error.
    - **When:** The "Categorize" button is clicked.
    - **Then:** An error message "Could not retrieve content from the URL." is displayed.

- **Scenario 4: LLM API Fails or Times Out**
    - **Given:** The LLM API service is down or does not respond within the timeout period.
    - **When:** A valid URL is submitted.
    - **Then:** An error message "Categorization service is temporarily unavailable. Please try again later." is displayed.

---

## 7. Future Work (Post-MVP)

This section outlines the planned evolution of the product for the AI agent to understand the long-term vision and build the MVP with extensibility in mind.

### 7.1. Iteration 2: Enhancing Usability & Persistence

- **Input:**
    - User signs up/logs in via an authentication provider (e.g., Google OAuth).
    - User saves the current URL via a browser extension icon click.
- **Processing:**
    - All saved links are stored in a persistent database (e.g., Firestore or Supabase PostgreSQL) linked to a `userId`.
    - User can manually change the category of a saved link. The change is updated in the database.
- **Output:**
    - A personal dashboard that displays all saved links, grouped by category.
    - UI elements for filtering by category and sorting by date.
- **Action:**
    - Users can update the category of a link.
    - Users can delete a saved link.
- **Validation:**
    - A link saved via the extension must appear on the web dashboard within 10 seconds.
    - Category changes must persist after a page refresh.
    - Deleting a link must remove it permanently.

### 7.2. Iteration 3: Growth & Sharing

- **Input:**
    - User selects one or more saved links and clicks a "Create Collection" button.
    - User gives the collection a title and a short description.
- **Processing:**
    - A new public, shareable webpage is dynamically generated with a unique URL (e.g., `linkstash.app/c/some-unique-id`).
    - The page is generated with proper SEO and social media meta tags (Open Graph).
- **Output:**
    - A shareable URL is provided to the user.
    - The public collection page displays the collection title, description, and the list of links.
    - The page includes a clear "Created with LinkStash" branding and a call-to-action to sign up.
- **Action:**
    - User can copy the collection link or share it directly to social media platforms.
- **Validation:**
    - The collection URL, when shared on platforms like Slack or Twitter, must display a rich preview (title, description, image).
    - The public URL must be accessible to non-logged-in users. 