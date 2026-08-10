# Luminous (LibreDB)

Luminous (LibreDB) is a comprehensive, full-stack book discovery and community platform—a modern "IMDb for Books." It enables readers to explore vast catalogs of literature, organize personal libraries, and connect with other readers through reviews and fandom communities.

## Features

### Discovery & Curation
*   **Intelligent Search**: Find books by title, author, or genre with semantic matching capabilities.
*   **Curated Collections**: Browse dynamic lists including trending titles, hidden gems, and new releases.
*   **Personal Library**: Curate and manage a personal collection of saved books.

### Community & Interaction
*   **Review System**: Write, read, and vote on community reviews. Ratings are automatically aggregated to reflect the overall community consensus.
*   **Fandoms & Forums**: Join dedicated communities to discuss favorite books, authors, or genres with like-minded readers.

### Smart Analysis
*   **Reading DNA**: Analyzes user reading habits, library contents, and reviews to generate a unique, personalized reading profile.
*   **Review Digests**: Automatically synthesizes hundreds of community reviews into a concise pros/cons summary and overall sentiment analysis.
*   **Interactive Q&A**: Ask specific questions about any book in the database to get immediate, context-aware answers based on the book's metadata and themes.

### Security
*   **Robust Authentication**: Secure JWT-based authentication with bcrypt password hashing.
*   **Account Recovery**: Complete password reset flow utilizing secure email token verification.

## Architecture & Tech Stack

**Frontend**
*   React (v19)
*   Vite
*   Tailwind CSS
*   React Router
*   TypeScript

**Backend**
*   Node.js & Express
*   TypeScript
*   MongoDB (Database)
*   esbuild (Production bundling)
*   JWT & bcrypt (Authentication)
*   Resend (Transactional emails)

## Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/project-luminous.git
   cd project-luminous
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and configure the following variables (refer to `.env.example` for details):
   *   `MONGODB_URI`: Connection string for your MongoDB instance.
   *   `JWT_SECRET`: Secret key for signing JWT tokens.
   *   `GEMINI_API_KEY`: API key for intelligent search and analysis features.
   *   `APP_URL`: The base URL of the deployed application (used for password reset links).
   *   `RESEND_API`: API key for the Resend email service.
   *   `EMAIL_FROM`: The "from" address for transactional emails.

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```

## Production Build

To build the application for production environments:

```bash
npm run build
```
This command compiles the frontend via Vite and bundles the Node.js backend using esbuild into a standalone `dist/server.cjs` file.

Start the production server:
```bash
npm run start
```
