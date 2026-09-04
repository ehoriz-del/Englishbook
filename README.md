# EnglishBook.com — complete GitHub Pages package

This package is designed for the operating model requested for EnglishBook.com: publish one complete chapter book at a time, keep previously published books available, and add future books without rebuilding the site structure.

## Current state
- **Anne of Green Gables** — published, all 38 chapters available.
- **Anne of Avonlea** — Coming soon.
- **Anne of the Island** — Coming soon.
- No login, user account, database, or per-user progress tracking.
- No publication dates are shown.

## GitHub setup
1. Create or open the GitHub repository for EnglishBook.com.
2. Upload **all contents of this folder to the repository root**. `index.html` must remain at the root.
3. Commit/push to the `main` branch.
4. In **Settings → Pages**, choose **GitHub Actions** as the source if it is not already selected.
5. The included `.github/workflows/pages.yml` deploys the site whenever you push to `main` or manually run the workflow.
6. `CNAME` already contains `englishbook.com`. Configure the matching DNS records at your domain provider.

## How publication works now
There is **no daily chapter-release automation**. A complete book is prepared first and then published manually in one release.

Each book has a status in `data/books.json`:
- `"published"` — the book can be opened and its chapters are displayed.
- `"coming-soon"` — the book remains visible with a Coming soon badge but cannot be opened.
- You can also simply omit a future book from `books.json` until you want it shown.

To publish a prepared book, upload its chapter Markdown files and images, add its chapter entries to `books.json`, then change its status to `"published"` and push the commit.

## Folder structure
- `index.html` — homepage/book accordion.
- `lesson.html` — reusable chapter lesson page.
- `assets/css/styles.css` — full responsive design.
- `assets/js/app.js` — book accordion, Markdown renderer, chapter navigation, and interactive practice.
- `data/books.json` — book status, chapter titles, Markdown paths, illustration paths, and featured series.
- `content/<book-id>/chapter-XX.md` — learning content.
- `images/<book-id>/chapter-XX.webp` — chapter illustrations.
- `images/books/` — original book-card artwork.
- `.github/workflows/pages.yml` — GitHub Pages deployment workflow.

## Adding future books
1. Create `content/<new-book-id>/`.
2. Add one Markdown file per chapter.
3. Create `images/<new-book-id>/` and add chapter illustrations plus a hero image if this is a new visual series.
4. Add the book and chapter list to `data/books.json`.
5. Use `status: "coming-soon"` while preparing it and `status: "published"` when the whole book is ready.

You do **not** need to rewrite `index.html` for every new book.

## Homepage hero behavior
The root `featuredSeries` value in `data/books.json` controls the hero. All current Anne books use `series: "anne"`, so the Anne hero stays in place while the Anne series is featured.

When EnglishBook moves to a different kind of book/series, give that book a different `series` value and change `featuredSeries` to that value. The homepage then loads that series' published book hero automatically.

See `ART-GUIDE.md` for the illustration continuity notes.

## Practice behavior
Each lesson includes three short interactive questions. Learners must select or type an answer before feedback appears. After an attempt, the page shows whether the answer was correct; if it was wrong, it also reveals the correct answer and a short explanation.

## Copyright / publisher note
The site content is an original educational adaptation based on the public-domain novel *Anne of Green Gables* by L. M. Montgomery. The summaries, modern learning dialogues, exercises, site design, covers, and chapter illustrations in this package are newly created for EnglishBook and are not copied from the Bantam Books edition.

Do not upload Bantam/Penguin Random House cover art, introduction, annotations, typography, or other edition-specific material, and do not imply endorsement or affiliation with a modern publisher.


## Runtime reliability update
The browser no longer fetches `data/books.json` or chapter Markdown files at runtime. `build_site_data.py` bundles the JSON metadata and Markdown into `data/site-data.js`. This avoids browser `Failed to fetch` errors while keeping `books.json` and the Markdown files as the editable source content.

When you edit `data/books.json` or a chapter Markdown file, commit/push normally. The included GitHub Action automatically rebuilds `data/site-data.js` before deployment. A prebuilt `data/site-data.js` is also committed so branch-based Pages previews can work.
