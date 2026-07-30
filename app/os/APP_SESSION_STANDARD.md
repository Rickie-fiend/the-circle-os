# Circle OS App Session Standard

## Structure

```text
Route
  Session: the stable place
    App frame: never moves
      App page: moves inside the frame
```

## Two app behaviors

### Journey

Used for questions, teaching, setup, and habit creation.

- A new chapter or server question begins with one cover.
- Pages move forward only.
- After an answer is saved, that input page is retired.
- After completion, only the useful idle app remains.
- Old input pages never become a history carousel.
- A new immutable chapter version creates a new journey and cover.

### Library

Used for charts, weekly views, and other things worth reading again.

- Pages may move in both directions.
- The frame keeps one stable height.
- The selected page survives route changes and reloads.
- New server data may create a new cover once.

## Interaction

- The outer session frame stays still.
- Only the inner page follows the finger.
- A swipe completes inside the clipped frame before state changes.
- The incoming page is promoted in place after the swipe. Its horizontal
  entrance never replays during the state change.
- When pages have different heights, the frame keeps its old height until the
  swipe completes, then eases to the new page height.
- A tap never becomes a swipe.
- Text fields never focus because of a swipe.
- Every swipe also has a button or keyboard path.

## Visual rules

- White: primary reflection.
- Orange: identity and active change.
- Dark: practical tools and evidence.
- Radius, border, background, and shadow belong to the stable frame whenever
  pages share a theme.
- Fixed-height chart sessions scroll inside themselves when needed. They never
  push the whole route while changing pages.
- Fluid-height sessions use the shared frame resize. Reduced-motion settings
  make the resize immediate.

## State

- Journey progress is stored by chapter id and immutable version.
- Library position is stored by session id and data version.
- A matching version restores the saved page.
- A new version returns to page zero.
