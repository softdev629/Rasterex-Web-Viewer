October 1, 2024

# 1. Comment Status Menu

Component Paths:
`src\app\app.module.t`
`src\app\components\annotation-tools\comment-status-icon\comment-status-icon.component.html`
`src\app\components\annotation-tools\comment-status-icon\comment-status-icon.component.scss`
`src\app\components\annotation-tools\comment-status-icon\comment-status-icon.component.spec.ts`
`src\app\components\annotation-tools\comment-status-icon\comment-status-icon.component.ts`
`src\app\components\annotation-tools\note-panel\note-panel-component.html`
`src\app\components\annotation-tools\note-panel\note-panel.component.scss`
`src\app\components\annotation-tools\note-panel\note-panel.component.ts`
`src\assets\scripts\rxcorefunctions.js`
`src\rxcore\constrants\index.ts`

# 2. Separate annotate objects and measure objects

Component Path:
`src\app\components\top-nav-menu\top-nav-menu.component.ts`
`src\app\components\annotation-tools\note-panel\note-panel.component.ts`

September 30, 2024

# 1. Code merge for panel and menu states.

September 27, 2024

# 1. Code merge of fixed comment list to make it stay open when switching between files.

Component Paths: `src\app\components\annotation-tools\note-panel\note-panel.component.ts`
`src\app\components\annotation-tools\annotation-tools.component.ts`

# 2. Fixed issue with canvas scaling on startup not working correctly.

Component Paths: `src\app\app.component.ts`

September 26, 2024

# 1. Code merge of fixed comment list with corrected comment reply listing.

Component Paths: `src\app\components\annotation-tools\note-panel\note-panel.component.html`
`src\assets\scripts\rxcorefunctions.js`

September 20, 2024

# 1. Code merge of new Text search and PDF page manipulation functions.

# 2. Code merge of new stamps, symbols and images functionality.

# 3. Fixed JavaScript printed only first page problem.

# 4. Fixed problem with thumbnails for other formats than PDF not working.

# 5. Fixed problem with undo redo restoring annoation with correct page number property.

# 6. Added new sort functions for comment list.

Component Paths: `src\app\components\annotation-tools\note-panel\note-panel.component.ts`
`src\assets\scripts\rxcorefunctions.js`

# 7. Added new download PDF method to download PDF modified in client.

July 07, 2024

# 1. Added rx-search-panel component

Component Path: `components/annotation-tools/search-panel`

# 2. Modified the annotation-tools.service.ts

### Added searchPanelState to control the visibility of the search-panel.

# 3. Modified Top Nav Menu

### Added a button to the Top Nav Menu template.

### Added two functions: `onCommentPanelSelect` and `onSearchPanelSelect` to control visibility.

# 4. Modified app template

### Added rx-search-panel to the template.

### Imported a pipe from `components/annotation-tools/search-panel` to highlight the search text.

# 5. Modified RxCore & rxcorefunctions.js

### Created functions:

- `documentTextSearch`
- `markupDocumentSearchResult`
- `markupTextWithOrange`
- `onGuiDocumentSearch`
