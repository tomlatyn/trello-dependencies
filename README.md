# Trello Card Dependencies Power-Up

A Trello Power-Up that allows you to manage card dependencies with bidirectional relationships.

## Features

- **Add Dependencies**: Create relationships between cards with a confirmation step
- **Dependency Types**:
  - Blocks / Is Blocked By
  - Is Related To
  - Is Duplicate To
  - Is Child To / Is Parent To
- **Dependency Preview**: Live preview of the full relationship while filling out the form
- **Form Validation**: Inline error highlighting and snackbar messages if the form is submitted incomplete
- **Bidirectional Sync**: Dependencies are automatically created on both cards
- **Card Badges**: Unresolved dependency count shown directly on the card
- **Resolve Dependencies**: Mark dependencies as resolved (strikethrough)
- **Remove Dependencies**: Remove individual or all dependencies
- **Dark Mode Support**: Automatically adapts to Trello's theme

## File Structure

```
trello-dependencies/
├── manifest.json                         # Power-Up configuration
├── index.html                            # Main iframe connector
├── images/
│   └── icon.png                         # Power-Up icon
├── js/
│   ├── client.js                        # Power-Up initialisation
│   ├── features/
│   │   ├── card-buttons.js             # Card button handler (opens popup)
│   │   ├── card-back-section.js        # Card back section handler
│   │   ├── card-badges.js             # Card badge handler (unresolved count)
│   │   └── card-detail-badges.js      # Card detail badge handler
│   └── views/
│       ├── add-dependency.js           # Add dependency popup controller
│       └── card-back-section.js        # Card back section controller
├── views/
│   ├── add-dependency.html             # Add dependency popup
│   └── card-back-section.html          # Card back section view
└── styles/
    ├── main.css                         # Global styles
    ├── popup.css                        # Add dependency popup styles
    └── card-back-section.css            # Card back section styles
```

## How It Works

### Data Storage

Dependencies are stored using Trello's storage API on each card under the key `dependencies`:

```javascript
{
  id: "dep_123456789_abc",
  relationshipId: "rel_123456789_xyz",
  type: "blocks",
  cardId: "linked-card-id",
  cardName: "Linked Card Name",
  resolved: false
}
```

Both records created for a dependency share the same `relationshipId`. This
keeps resolve and remove operations linked to exactly one dependency on each
card. Older records without `relationshipId` remain supported through a
card/type fallback.

### Bidirectional Dependencies

When you create a dependency from Card A to Card B:
1. Card A gets the dependency you selected (e.g., "blocks")
2. Card B automatically gets the reverse dependency (e.g., "is blocked by")

When you remove a dependency, the reverse is removed from the linked card automatically.

### Dependency Type Mapping

| Type | Reverse |
|------|---------|
| Blocks | Is Blocked By |
| Is Blocked By | Blocks |
| Is Related To | Is Related To |
| Is Duplicate To | Is Duplicate To |
| Is Child To | Is Parent To |
| Is Parent To | Is Child To |

## Setup

1. **Host the files** on any static hosting service (GitHub Pages, Netlify, Vercel, etc.) over HTTPS.

2. **Register with Trello**:
   - Go to [trello.com/power-ups/admin](https://trello.com/power-ups/admin)
   - Create a new Power-Up and set the iframe connector URL to your hosted `index.html`

3. **Add to a board** via the Power-Ups menu.

## Usage

### Adding a Dependency

1. Open a card and click the **Dependencies** button in the card actions
2. Select a dependency type from the dropdown
3. The preview below the dropdown shows the relationship as you build it
4. Search for and click the target card to select it
5. Click **Add dependency** to confirm — the dependency is created on both cards

If you click the button without a type or card selected, the incomplete field is highlighted in red and a message appears at the bottom of the popup.

### Viewing Dependencies

Dependencies appear in the **Dependencies** section on the card back. Each row shows:
- The relationship type
- The linked card name (click to navigate to it)
- A **Resolve** button to mark it done
- A **Remove** button to delete it

Cards with unresolved dependencies show a red badge with the count.

### Resolving a Dependency

Click **Resolve** next to a dependency to mark it as resolved (strikethrough). The resolved state is synced to the linked card. Click again to unresolve.

### Removing Dependencies

- **Individual**: click **Remove** on a dependency row
- **All**: click **Remove All** in the section header

Both options also remove the reverse dependency from the linked card.

## Local Development

Open any of the HTML files directly in a browser or serve the project with a static file server from the repo root:

```bash
npx serve .
```

A local test harness lives in `local-test/` (gitignored). Open `local-test/index.html` to browse test views for each popup with mock data pre-loaded in `localStorage`. Test data can be reset from the harness dashboard.

## Technical Notes

- Iframe-based Power-Up architecture — no external server required
- All data stored in Trello's built-in key-value storage per card
- Dark mode detected via `t.subscribeToThemeChanges()`
- Iframe height auto-resizes to content in the card back section

## License

MIT
