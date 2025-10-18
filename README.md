# Trello Card Dependencies Power-Up

A Trello Power-Up that allows you to manage card dependencies with bidirectional relationships.

## Features

- **Add Dependencies**: Create relationships between cards
- **Dependency Types**:
  - Blocks
  - Is Blocked By
  - Is Related To
  - Is Duplicate To
  - Is Child To
  - Is Parent To
- **Bidirectional Sync**: Dependencies are automatically created on both cards
- **Resolve Dependencies**: Mark dependencies as resolved (strikethrough text)
- **Remove Dependencies**: Remove individual or all dependencies
- **Dark Mode Support**: Automatically adapts to Trello's theme

## File Structure

```
trello-dependencies/
├── manifest.json                       # Power-Up configuration
├── index.html                          # Main iframe connector
├── images/
│   └── icon.png                       # Power-Up icon (PNG)
├── js/
│   ├── client.js                      # Power-Up initialization
│   ├── features/
│   │   ├── card-buttons.js           # Card button handler
│   │   └── card-back-section.js      # Card back section handler
│   └── views/
│       ├── add-dependency.js         # Add dependency popup controller
│       └── card-back-section.js      # Card back section controller
├── views/
│   ├── add-dependency.html           # Add dependency popup
│   └── card-back-section.html        # Card back section view
└── styles/
    ├── main.css                       # Global styles
    ├── popup.css                      # Add dependency popup styles
    └── card-back-section.css          # Card back section styles
```

## How It Works

### Data Storage

Dependencies are stored using Trello's storage API:

```javascript
// Dependency object structure
{
  id: "dep_123456789_abc",
  type: "blocks",
  cardId: "linked-card-id",
  cardName: "Linked Card Name",
  resolved: false
}
```

Each card stores an array of dependencies in its shared storage with the key `dependencies`.

### Bidirectional Dependencies

When you create a dependency from Card A to Card B:
1. Card A gets the dependency you selected (e.g., "blocks")
2. Card B automatically gets the reverse dependency (e.g., "is blocked by")
3. Both dependencies reference each other

When you remove a dependency:
1. The dependency is removed from the current card
2. The reverse dependency is automatically removed from the linked card

### Dependency Type Mapping

| Type | Reverse Type |
|------|--------------|
| Blocks | Is Blocked By |
| Is Blocked By | Blocks |
| Is Related To | Is Related To |
| Is Duplicate To | Is Duplicate To |
| Is Child To | Is Parent To |
| Is Parent To | Is Child To |

## Setup Instructions

1. **Host the Power-Up**:
   - Upload all files to a static hosting service (GitHub Pages, Netlify, Vercel, etc.)
   - Ensure files are served over HTTPS
   - Note the base URL

2. **Register with Trello**:
   - Go to https://trello.com/power-ups/admin
   - Create a new Power-Up
   - Upload the `manifest.json` content
   - Set the iframe connector URL to your hosted `index.html`
   - Save and enable the Power-Up

3. **Add to a Board**:
   - Open a Trello board
   - Go to Power-Ups menu
   - Find your Power-Up and add it to the board

## Usage

### Adding a Dependency

1. Open a card
2. Click the Power-Up button "Add Dependency"
3. Select the dependency type
4. Search for and click on the target card
5. The dependency is created on both cards

### Viewing Dependencies

- Dependencies appear in the card back section titled "Dependencies"
- Each dependency shows:
  - Type of relationship
  - Linked card name (clickable)
  - Resolve button (○/✓)
  - Remove button (×)

### Resolving a Dependency

- Click the ○ button next to a dependency
- The linked card name will show as strikethrough
- Click again to unresolve

### Removing Dependencies

- **Individual**: Click the × button next to a dependency
- **All**: Click the "Remove All" action button in the section header
- Removal automatically updates both cards

## Technical Notes

- Uses Trello's iframe-based Power-Up architecture
- All data stored in Trello's key-value storage
- No external server required
- Real-time theme detection and dark mode support
- Automatic iframe resizing based on content

## Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT License - feel free to modify and use as needed.
