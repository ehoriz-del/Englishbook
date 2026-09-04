# EnglishBook illustration guide

## Anne series visual identity
Keep `images/anne-of-green-gables/hero.webp` as the homepage hero while the Anne series is the featured series. The included chapter images are original watercolor-tone educational illustrations and do not reproduce a Bantam/Penguin Random House cover or edition artwork.

Character continuity used for the current art:
- Anne: very thin, red hair, freckles, green/gray-green eyes; two braids while younger, hair pinned up as she grows older; modest late-19th-century dresses.
- Marilla: tall, thin, dark hair with gray streaks in a tight bun; plain, practical dark clothing.
- Matthew: older, quiet rural farmer in restrained late-19th-century clothing.
- Diana: dark hair and a softer, more polished appearance than Anne.
- Gilbert: brown/dark hair, schoolboy-to-young-man progression.

The visual setting is rural Prince Edward Island in the late 19th century: simple farmhouses, schoolhouse, church, country roads, orchards, fields, horse-drawn transport, and period-appropriate interiors.

## When the site moves beyond the Anne series
1. Add the new book and its own `hero` path in `data/books.json`.
2. Give that book a new `series` value.
3. Change the root `featuredSeries` value to the new series.
4. The homepage JavaScript will automatically use the first published book in that series as the hero image.

Do not change `index.html` just to switch the hero.
