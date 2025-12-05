# Keyboard Registry

A centralized keyboard shortcut management system for the application.

## Features

- **Centralized Registry**: All keyboard shortcuts are registered in a single global registry
- **React Hook**: Easy-to-use `useKeyboardShortcut` hook for React components
- **Conflict Prevention**: Only one matching shortcut triggers per keypress
- **Cross-Platform**: Automatically maps Ctrl to Command (⌘) on macOS
- **Modifier Keys**: Support for Ctrl, Shift, Alt, and Meta (Command on Mac)
- **Input Protection**: Automatically ignores shortcuts when typing in input fields (except Escape)
- **OS-Aware Formatting**: Displays shortcuts with appropriate symbols (⌘ on Mac, Ctrl on Windows/Linux)
- **Enable/Disable**: Toggle shortcuts on/off without unregistering
- **Auto-cleanup**: Automatically unregisters shortcuts when components unmount

## macOS Behavior

**Important:** On macOS, all `ctrl` shortcuts automatically use the Command key (⌘) instead!

- You define shortcuts using `ctrl: true` in your code
- On macOS: Users press **Command (⌘)** + key
- On Windows/Linux: Users press **Ctrl** + key
- Display automatically shows the correct key for each platform

Example:

```tsx
// This code:
{ key: 's', ctrl: true }

// Works as:
// macOS: ⌘S (Command+S)
// Windows/Linux: Ctrl+S
```

This means you don't need separate shortcuts for different platforms!

## Usage

### Basic Example

```tsx
import { useKeyboardShortcut } from "../lib/keyboardRegistry";

function MyComponent() {
 const [count, setCount] = useState(0);

 // Register a keyboard shortcut
 useKeyboardShortcut(
  "my-component-increment", // Unique ID
  {
   key: "i",
   ctrl: true,
   shift: true,
   description: "Increment counter",
   handler: () => setCount((c) => c + 1),
  },
  [setCount], // Dependencies
 );

 return <div>Count: {count}</div>;
}
```

### Using Global Shortcuts

```tsx
import { GLOBAL_SHORTCUTS } from "../lib/globalShortcuts";
import { useKeyboardShortcut } from "../lib/keyboardRegistry";

function MyComponent() {
 useKeyboardShortcut(
  "my-search-focus",
  {
   ...GLOBAL_SHORTCUTS.FOCUS_SEARCH,
   handler: () => {
    searchInputRef.current?.focus();
   },
  },
  [],
 );
}
```

### Conditional Shortcuts

```tsx
function MyDialog({ open, onClose }) {
 // Only register when dialog is open
 useKeyboardShortcut(
  "my-dialog-close",
  open
   ? {
      ...GLOBAL_SHORTCUTS.ESCAPE,
      handler: onClose,
     }
   : null, // Pass null to disable
  [open, onClose],
 );
}
```

### Direct Registry Access

```tsx
import { keyboardRegistry } from "../lib/keyboardRegistry";

// Register outside of React
keyboardRegistry.register("my-shortcut", {
 key: "s",
 ctrl: true,
 description: "Save",
 handler: () => console.log("Saved!"),
});

// Unregister
keyboardRegistry.unregister("my-shortcut");

// Get all shortcuts
const all = keyboardRegistry.getAllShortcuts();

// Format for display
const formatted = keyboardRegistry.formatShortcut({
 key: "s",
 ctrl: true,
 shift: true,
}); // Returns "Ctrl+Shift+S" on Windows/Linux or "⌘⇧S" on Mac
```

## Shortcut Configuration

```typescript
interface KeyboardShortcut {
 key: string; // The key to press (lowercase)
 ctrl?: boolean; // Ctrl modifier
 shift?: boolean; // Shift modifier
 alt?: boolean; // Alt modifier
 meta?: boolean; // Command (⌘) on Mac, Windows key on Windows
 description: string; // Human-readable description
 handler: (event: KeyboardEvent) => void;
 preventDefault?: boolean; // Default: true
 stopPropagation?: boolean; // Default: false
 enabled?: boolean; // Default: true
}
```

## Global Shortcuts

The following shortcuts are available globally (on macOS, use ⌘ Command instead of Ctrl):

### Navigation

- **Ctrl+B** (⌘B on Mac): Toggle sidebar
- **Ctrl+1** (⌘1 on Mac): Go to Dashboard
- **Ctrl+2** (⌘2 on Mac): Go to Projects
- **Ctrl+3** (⌘3 on Mac): Go to Logs
- **Ctrl+4** (⌘4 on Mac): Go to Users

### Search & Filters

- **Ctrl+K** (⌘K on Mac): Focus search/filter
- **Ctrl+L** (⌘L on Mac): Clear all filters
- **Ctrl+Shift+E** (⌘⇧E on Mac): Toggle filter edit mode
- **Ctrl+Shift+F** (⌘⇧F on Mac): Open filter drawer

### Table Controls

- **Ctrl+Shift+H** (⌘⇧H on Mac): Toggle column visibility menu
- **Ctrl+Shift+D** (⌘⇧D on Mac): Toggle density menu

### General

- **Escape**: Close dialogs/drawers
- **Ctrl+R** (⌘R on Mac): Refresh current page
- **Ctrl+/** (⌘/ on Mac): Show keyboard shortcuts panel
- **Ctrl+/**: Show keyboard shortcuts panel

## Best Practices

1. **Use Unique IDs**: Always use unique, descriptive IDs for shortcuts
2. **Add to globalShortcuts.ts**: Add commonly-used shortcuts to the global shortcuts file
3. **Include Dependencies**: Always include proper dependencies in the deps array
4. **Document Shortcuts**: Add descriptions for all shortcuts
5. **Test Conflicts**: Ensure your shortcuts don't conflict with browser defaults
6. **Conditional Registration**: Use null to disable shortcuts conditionally
7. **Clean Component IDs**: Use format like `component-name-action` for IDs

## Examples in Codebase

- **Layout.tsx**: Navigation shortcuts (Ctrl+1, Ctrl+2, etc.)
- **KeyboardShortcutsButton.tsx**: Help dialog (Ctrl+/)
- Add your implementations here...

## Adding New Global Shortcuts

1. Add to `globalShortcuts.ts`:

```typescript
export const GLOBAL_SHORTCUTS = {
 // ... existing shortcuts
 MY_NEW_SHORTCUT: {
  key: "m",
  ctrl: true,
  description: "My new action",
 },
};
```

2. Register in your component:

```tsx
useKeyboardShortcut(
 "my-component-my-action",
 {
  ...GLOBAL_SHORTCUTS.MY_NEW_SHORTCUT,
  handler: () => {
   // Your action here
  },
 },
 [],
);
```

3. Add to KeyboardShortcutsButton categories if user-facing

## Technical Details

- **Singleton Pattern**: One global registry instance
- **Event Delegation**: Single keydown listener on window
- **First Match Wins**: Only the first matching shortcut executes
- **Input Field Detection**: Automatically skips shortcuts when focus is in text inputs
- **Automatic Cleanup**: Removes event listener when no shortcuts are registered
