# FilterToolbar Component

A reusable toolbar component that combines a page title with filterable fields. Features a responsive layout that shows a limited number of filters in the toolbar and provides a "More Filters" button to access additional filters in a side drawer.

## Features

- **Responsive Toolbar**: Shows title and filters in a single row
- **Pinnable Filters**: Users can pin/unpin filters to control which appear in the toolbar vs. the drawer
- **Equal Width Distribution**: Filters are sized proportionally based on available space
- **Side Drawer**: Additional filters accessible via "More Filters" button
- **Persistent Preferences**: Pin state can be saved to localStorage
- **Type Support**: Select, text, number, and date input types

## Usage

```tsx
import FilterToolbar, { type FilterConfig } from "../components/FilterToolbar";

const [pinnedFilters, setPinnedFilters] = useState<string[]>(() => {
 const saved = localStorage.getItem("my-page-pinned-filters");
 return saved ? JSON.parse(saved) : ["filter1", "filter2"];
});

const handlePinToggle = (filterId: string) => {
 const newPinned = pinnedFilters.includes(filterId) ? pinnedFilters.filter((id) => id !== filterId) : [...pinnedFilters, filterId];
 setPinnedFilters(newPinned);
 localStorage.setItem("my-page-pinned-filters", JSON.stringify(newPinned));
};

const filterConfigs: FilterConfig[] = [
 {
  id: "method",
  label: "Method",
  type: "select",
  value: filters.method,
  options: [
   { value: "GET", label: "GET" },
   { value: "POST", label: "POST" },
  ],
  onChange: (value) => setFilters({ ...filters, method: value as string }),
  pinned: pinnedFilters.includes("method"),
  minWidth: 120,
 },
 {
  id: "statusCode",
  label: "Status Code",
  type: "number",
  value: filters.statusCode,
  onChange: (value) => setFilters({ ...filters, statusCode: value as number }),
  pinned: pinnedFilters.includes("statusCode"),
  minWidth: 120,
 },
];

<FilterToolbar title='My Page' filters={filterConfigs} onPinToggle={handlePinToggle} maxVisibleFilters={3} actions={<Button>Action</Button>} />;
```

## Props

### FilterToolbarProps

| Prop                | Type                         | Default  | Description                                              |
| ------------------- | ---------------------------- | -------- | -------------------------------------------------------- |
| `title`             | `string`                     | required | The page title displayed on the left                     |
| `filters`           | `FilterConfig[]`             | required | Array of filter configurations                           |
| `onPinToggle`       | `(filterId: string) => void` | optional | Callback when a filter is pinned/unpinned                |
| `maxVisibleFilters` | `number`                     | `3`      | Maximum filters to show in toolbar before "More Filters" |
| `actions`           | `React.ReactNode`            | optional | Additional actions to display on the right               |

### FilterConfig

| Property   | Type                                             | Required   | Description                         |
| ---------- | ------------------------------------------------ | ---------- | ----------------------------------- |
| `id`       | `string`                                         | ✓          | Unique identifier for the filter    |
| `label`    | `string`                                         | ✓          | Display label                       |
| `type`     | `"select" \| "text" \| "number" \| "date"`       | ✓          | Input type                          |
| `value`    | `string \| number \| undefined`                  | ✓          | Current filter value                |
| `options`  | `{ value: string; label: string }[]`             | for select | Options for select type             |
| `onChange` | `(value: string \| number \| undefined) => void` | ✓          | Value change handler                |
| `pinned`   | `boolean`                                        | optional   | Whether filter is pinned to toolbar |
| `minWidth` | `number`                                         | optional   | Minimum width in pixels             |

## Behavior

### Filter Distribution

1. **Pinned filters** are shown first up to `maxVisibleFilters`
2. Remaining slots filled with **unpinned filters** in order
3. Any filters that don't fit go to the **drawer**

### Width Calculation

- Toolbar space divided equally: `100% / maxVisibleFilters`
- Each filter gets proportional flex space
- `minWidth` respected for individual filters
- Responsive with flexbox wrapping on small screens

### Pin/Unpin

- Click pin icon in drawer to toggle
- Pinned filters move to toolbar (if space available)
- Unpinned filters move to drawer
- Pin state managed by parent component
- Recommend persisting to localStorage

## Example: Logs Page

See `src/pages/Logs.tsx` for a complete implementation with 5 filters (method, environment, statusCode, path, projectId) where 3 are shown in toolbar by default.
