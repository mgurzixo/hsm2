# Copilot Instructions for hsm2

## Project Overview

- **hsm2** is a Hierarchical State Machine (HSM) editor and visualizer, built with Vue and Quasar, supporting interactive editing and visualization of state machines.
- The main UI logic and state management are in `src/`, with core classes in `src/classes/` and UI components in `src/components/`.
- The app is started and built using Quasar CLI (`quasar dev`, `quasar build`).

## Key Architectural Patterns

- **Class-based Model:** Core logic is organized into ES6 classes (e.g., `Cfolio`, `Cstate`, `Ctr`, `Cnote`) in `src/classes/`. Each class represents a domain concept (folio, state, transition, note) and manages its own DOM element and geometry.
- **Direct DOM Manipulation:** Classes often manipulate their own DOM elements directly (e.g., `this.myElem.style.transform`).
- **Hierarchical Composition:** Objects (folios, states, notes) are composed hierarchically, reflecting the HSM structure. Children are managed via arrays like `this.children`, `this.notes`, `this.trs`.
- **Event Handling:** User interactions (wheel, drag, insert) are handled by methods on these classes, often updating geometry and triggering redraws (`hsm.draw()`).
- **Global Contexts:** Shared state and utilities are imported from `src/classes/Chsm.js` (e.g., `hsm`, `hCtx`, `modeRef`).

The project is being switched from using a canvas to using DOM elements for display.

## Developer Workflows

- **Install dependencies:** `yarn` or `npm install`
- **Development server:** `quasar dev`
- **Build for production:** `quasar build`
- **Linting:** `yarn lint` or `npm run lint`
- **Formatting:** `yarn format` or `npm run format`

## Project-Specific Conventions

- **Units:** Geometry is managed in millimeters (mm) for precision, with utility conversions in `src/lib/utils.js` (e.g., `U.pxToMm`).
- **Transformations:** Homothetic (uniform scaling) transforms are applied using CSS `matrix()` or `scale()` on elements, with custom logic for transform origins and scaling factors.
- **Deferred Updates:** Some updates (e.g., notes) are deferred using `setTimeout` to batch DOM changes (`deferredNotesUpdate`). This was true when the system was drawing on a canvas. As the project has switched to HTML elements, this is not true anymore and the notes updates are done synchronously. But the conversion mdText->html is cached in the element
- **ID Generation:** New states/notes/transitions use `hsm.newSernum()` for unique IDs.
- **Settings:** App-wide settings (scaling, styles, min sizes) are accessed via `hsm.settings`.
- **Comments and logs:** The logs starts with the module and function name like this: [module.functionName]. Do not remove commented logs, and feel free to add signifiant (but not too large or too many) logs to help the developer understand and check the new elements.

## Integration Points

- **Quasar/Vue:** UI components in `src/components/` and layouts in `src/layouts/` use Vue SFCs and Quasar widgets.
- **Electron:** Desktop integration via `src-electron/` for packaging as a desktop app.
- **Assets:** Images and icons are in `public/assets/` and `src/assets/`.

## Example: Adding a State

- Use `Cfolio.insertState(x, y)` to add a new state at a given position. This method creates a `Cstate` instance, updates the hierarchy, and triggers a redraw.

## References

- Main entry: `src/App.vue`
- Core logic: `src/classes/`
- Utilities: `src/lib/`
- Settings: `hsm.settings` (from `src/classes/Chsm.js`)

---

If you are an AI agent, follow these conventions and patterns for all code generation and refactoring tasks. When in doubt, prefer the patterns found in `src/classes/` and always update geometry of the instance (x0/y0/scale in this.geo) and DOM in sync with the HSM hierarchy.
