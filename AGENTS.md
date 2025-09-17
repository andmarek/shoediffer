# AGENTS.md - ShoeDiffer Project Guide

## Project Overview
**ShoeDiffer** is a running shoe comparator website that provides side-by-side comparisons of running shoes with clear specifications, fit visuals, and rotation ideas. The tagline is "Your one stop shop for more information about running shoes than you needed."

Currently in MVP phase with basic comparison functionality implemented.

## Purpose & Features
- **Core Function**: Compare 2-3 running shoes side-by-side
- **Comparison Metrics**: Weight, heel-to-toe drop, price, foam type, stack height
- **User Flow**: Select shoes → Compare → View detailed comparison charts

### Planned Features (Not Yet Implemented)
- Shoe overlays for fit comparison (similar to bikeinsights for bikes)
- Shoe rotation builder for training plans
- Extended shoe database beyond current 9 shoes

## Tech Stack
- **Runtime**: Bun
- **Framework**: SvelteKit (Svelte 5)
- **Styling**: Tailwind CSS v4
- **TypeScript**: Full TypeScript support
- **Testing**: Vitest with Playwright for browser testing

## Project Structure
```
src/
├── routes/                 # SvelteKit routes
│   ├── +layout.svelte     # Layout wrapper
│   └── +page.svelte       # Main app page
├── lib/
│   ├── components/        # Svelte components
│   │   ├── ShoeList.svelte       # Shoe selection grid
│   │   └── ComparisonChart.svelte # Side-by-side comparison
│   └── data/
│       └── shoes.js       # Shoe data loader & utilities
└── data/
    └── shoes/
        └── mens/          # JSON files for each shoe
```

## Key Components
- **ShoeList.svelte**: Grid interface for selecting 2-3 shoes to compare
- **ComparisonChart.svelte**: Visual comparison with bar charts and best/worst indicators
- **Shoe Data**: JSON files containing specs (price, weight, drop, URL, etc.)

## Development Commands
```bash
# Start development server
bun run dev

# Build for production  
bun run build

# Type checking
bun run check

# Linting & formatting
bun run lint
bun run format

# Run tests
bun run test
```

## Data Model
Shoes are stored as JSON files in `src/data/shoes/mens/` with structure:
```json
{
  "name": "Brooks Ghost 17",
  "brand": "Brooks", 
  "model": "Ghost 17",
  "price": 150,
  "weightOunces": 10.1,
  "offsetMilimeters": 10,
  "url": "https://..."
}
```

## Code Conventions
- Use Svelte 5 syntax and features
- Tailwind for all styling (no custom CSS)
- TypeScript for type safety
- Export named functions from modules
- Component props use `export let` syntax
- Reactive statements with `$:` for computed values

## Current State
- 9 shoes in database (mostly Brooks, some Hoka/Saucony)
- Basic comparison functionality working
- Clean, responsive UI with Tailwind
- Ready for expansion of shoe database and additional features
