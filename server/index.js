import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = process.env.PORT || 3001;
const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDirectory = path.join(rootDirectory, "client", "dist");

app.get("/api/books", async (request, response) => {
  const query = request.query.q?.trim();

  if (!query) {
    return response.status(400).json({ error: "A book title is required." });
  }

  if (!process.env.GOOGLE_BOOKS_API_KEY) {
    return response.status(500).json({ error: "The book search service is not configured." });
  }

  const booksUrl = new URL("https://www.googleapis.com/books/v1/volumes");
  booksUrl.searchParams.set("q", query);
  booksUrl.searchParams.set("key", process.env.GOOGLE_BOOKS_API_KEY);
  booksUrl.searchParams.set("maxResults", "10");
  
  try {
    const booksResponse = await fetch(booksUrl, {
      signal: AbortSignal.timeout(10000)
    });
    const payload = await booksResponse.json();

    if (!booksResponse.ok) {
      return response.status(booksResponse.status).json({
        error: payload.error?.message || "Book search is unavailable right now."
      });
    }

    return response.json({
      books: (payload.items || []).map((book) => ({
        id: book.id,
        title: book.volumeInfo.title || "Untitled",
        authors: book.volumeInfo.authors || ["Unknown author"],
        thumbnail: book.volumeInfo.imageLinks?.thumbnail?.replace("http:", "https:"),
        infoLink: book.volumeInfo.infoLink || null
      }))
    });
  } catch {
    return response.status(502).json({ error: "Unable to reach Google Books. Please try again." });
  }
});

app.use(express.static(clientDirectory));
app.get("*", (_request, response) => response.sendFile(path.join(clientDirectory, "index.html")));

export const handler = serverless(app);
