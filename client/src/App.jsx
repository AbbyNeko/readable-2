import { useEffect, useMemo, useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import readableLogo from "../../img/readablelogo.png";

const shelves = {
  read: { title: "Books I've Read", action: "Read" },
  reading: { title: "Books I'm Currently Reading", action: "Reading" },
  want: { title: "Books I Want to Read", action: "Want to Read" }
};

const defaultLists = { read: [], reading: [], want: [] };

function getRoute() {
  return window.location.hash.replace("#", "") || "/";
}

function getStoredLists() {
  try {
    const savedLists = JSON.parse(localStorage.getItem("bookLists"));
    if (savedLists.booksIRead) {
      const migrate = (titles) => titles.map((title, index) => ({
        id: `legacy-${title}-${index}`,
        title,
        authors: ["Unknown author"]
      }));
      return {
        read: migrate(savedLists.booksIRead || []),
        reading: migrate(savedLists.booksImReading || []),
        want: migrate(savedLists.booksIWantToRead || [])
      };
    }
    return { ...defaultLists, ...savedLists };
  } catch {
    return defaultLists;
  }
}

function getAvatar() {
  let identifier = localStorage.getItem("userIcon");
  if (!identifier) {
    identifier = crypto.randomUUID();
    localStorage.setItem("userIcon", identifier);
  }
  return `https://api.dicebear.com/9.x/dylan/png?seed=${encodeURIComponent(identifier)}`;
}

function Header({ route, avatar }) {
  const links = [
    ["/read", "Books I've Read"],
    ["/reading", "Currently Reading"],
    ["/want", "Want to Read"]
  ];

  return (
    <header className="top-bar">
      <a className="brand" href="/#" aria-label="Readable home">
        <img className="brand-mark" src={readableLogo} alt="" />
        <span>Readable<small>the Virtual Bookshelf</small></span>
      </a>
      <nav aria-label="Main navigation">
        {links.map(([href, label]) => (
          <a key={href} href={`#${href}`} className={route === href ? "active" : ""}>{label}</a>
        ))}
      </nav>
      <div className="user-profile"><img src={avatar} alt="User avatar" /><span>User</span></div>
    </header>
  );
}

function Footer() {
  return <footer className="site-footer">Site Created by: Aaron Peabody, Abigail Limpioso, Ryan Peffer, Dennis Desmornes</footer>;
}

function SearchPage({ addBook }) {
  const [term, setTerm] = useState("");
  const [error, setError] = useState("");
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  async function search(event) {
    event.preventDefault();
    const query = term.trim();
    if (!query) {
      setError("Enter a book title to search.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch(`/api/books?q=${encodeURIComponent(query)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setBooks(payload.books);
    } catch (searchError) {
      setBooks([]);
      setError(searchError.message || "Unable to search for books right now.");
    } finally {
      setIsLoading(false);
    }
  }

  return <main className="page home-page">
    <blockquote>“Share and store all the literature you find Readable. Keep track of what you’ve read, what you’re reading, and what comes next.”<cite>the Readable team</cite></blockquote>
    <form className="search-form" onSubmit={search} noValidate>
      <label htmlFor="books">Search for a book</label>
      <div className="search-row"><input id="books" type="search" value={term} onChange={(event) => setTerm(event.target.value)} aria-describedby="search-error" /><button type="submit">Search Books</button></div>
      <p id="search-error" className="search-error" role="alert">{error}</p>
    </form>
    {isLoading && <p className="status">Searching the shelves…</p>}
    <section className="book-grid" aria-live="polite">
      <ToastContainer/>
      {books.map((book) => <BookCard key={book.id} book={book} addBook={addBook} />)}
    </section>
  </main>;
}

function BookCard({ book, addBook }) {
  return <article className="book-card">
    {book.thumbnail ? <img src={book.thumbnail} alt={`Cover of ${book.title}`} /> : <div className="cover-placeholder">No cover</div>}
    <h2>{book.title}</h2><p>{book.authors.join(", ")}</p>
    <div className="book-actions">{Object.entries(shelves).map(([shelf, details]) => <button key={shelf} onClick={() => addBook(shelf, book)}>{details.action}</button>)}</div>
    {book.infoLink && <a className="details-link" href={book.infoLink} target="_blank" rel="noreferrer">View details</a>}
  </article>;
}

function ShelfPage({ shelf, books, removeBook }) {
  const details = shelves[shelf];
  return <main className="page shelf-page"><h1>{details.title}</h1><ToastContainer/>
    {books.length === 0 ? <p className="empty-state">No books here yet. Search for a title to add one.</p> : <ul className="shelf-list">{books.map((book) => <li key={book.id}><span>{book.title}<small>{book.authors.join(", ")}</small></span><button onClick={() => removeBook(shelf, book.id)}>Remove</button></li>)}</ul>}
  </main>;
}

export default function App() {
  const [route, setRoute] = useState(getRoute);
  const [lists, setLists] = useState(getStoredLists);
  const avatar = useMemo(getAvatar, []);

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  useEffect(() => localStorage.setItem("bookLists", JSON.stringify(lists)), [lists]);

  function addBook(shelf, book) {
    setLists((current) => current[shelf].some((saved) => saved.id === book.id) ? current : { ...current, [shelf]: [...current[shelf], book] });
    toast.success("Book added to the shelf!", { position: "top-right", autoClose: 2000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, progress: undefined });
  }
  function removeBook(shelf, id) {
    setLists((current) => ({ ...current, [shelf]: current[shelf].filter((book) => book.id !== id) }));
    toast.info("Book removed from the shelf.", { position: "top-right", autoClose: 2000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, progress: undefined });
  }

  const shelf = route === "/read" ? "read" : route === "/reading" ? "reading" : route === "/want" ? "want" : null;
  return <div className="app-shell"><Header route={route} avatar={avatar} />{shelf ? <ShelfPage shelf={shelf} books={lists[shelf]} removeBook={removeBook} /> : <SearchPage addBook={addBook} />}<Footer /></div>;
}
