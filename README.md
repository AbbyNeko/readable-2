# Readable

A React virtual bookshelf with an Express API that keeps the Google Books API key on the server.

## Run locally

1. Use Node.js 18 or later.
2. Copy `.env.example` to `.env` and add `GOOGLE_BOOKS_API_KEY`.
3. Install dependencies: `npm install`
4. Start the React client and Node API: `npm run dev`
5. Visit `http://localhost:5173`.

For a production build, run `npm run build`, then `npm start` and visit `http://localhost:3001`.
