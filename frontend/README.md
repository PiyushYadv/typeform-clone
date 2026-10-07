# Frontend — Typeform Clone

Next.js 16 (App Router, TypeScript) + Tailwind 4 + Framer Motion.

## Run locally

```bash
cd frontend
cp .env.example .env.local     # points at the API, default http://localhost:8000
npm install
npm run dev                    # http://localhost:3000
```

Start the backend first. `/forms` is the workspace; open a form to edit it,
or open a published form's link (`/to/<slug>`) to fill it in.

## Respondent flow (`src/components/respondent/`)

| File | Job |
|---|---|
| `FormRunner.tsx` | Welcome → questions → thank-you. Owns answers, errors, navigation, submission and the slide transitions. |
| `QuestionView.tsx` | One question screen. Reused read-only by the builder's live preview, so both always match. |
| `inputs/` | Text (short, long, email, number), choice (multiple choice, yes/no), dropdown, rating. |
| `useShortcutKeys.ts` | A/B/C, Y/N and 1–5 shortcuts, only for the question on screen. |
| `Screens.tsx` | Welcome, thank-you, closed and loading screens. |

Keyboard: Enter advances, Shift+Enter adds a line break in long answers,
↑/↓ move between questions, letters pick choices, numbers pick ratings.
Choices blink, then auto-advance, as in Typeform.

Validation runs on the client for instant feedback (`src/lib/validation.ts`)
and again on the server; server errors map back to the right question.

Theme colors are CSS variables (`src/lib/theme.ts`), so a form's custom
theme restyles every screen.

## Pages

| Route | Page |
|---|---|
| `/forms` | Workspace: list with status and response counts; create, rename, duplicate, delete, copy link |
| `/forms/[id]/create` | Builder |
| `/forms/[id]/results` | Results |
| `/to/[slug]` | Public form, no login |

## Builder (`src/components/builder/`)

| File | Job |
|---|---|
| `useFormEditor.ts` | Local draft state plus debounced autosave. Questions save as one ordered list (`PUT /questions`); new items get server ids matched back by position. One save at a time; edits made mid-save trigger another. |
| `draft.ts` | Draft model. Every question/option has a client `key`, so drag-and-drop and React lists work before ids exist. |
| `ContentPanel.tsx` | Question list with drag-to-reorder (dnd-kit, mouse and keyboard) and the thank-you ending. |
| `Canvas.tsx` | The selected screen as respondents see it, themed, with title, description and choices editable in place. Reuses the respondent input components. |
| `SettingsPanel.tsx` | Type, required, rating steps, number min/max, duplicate, delete. |
| `DesignMenu.tsx` | Theme presets. |
| `PreviewOverlay.tsx` | Full run-through of the unsaved draft using the real `FormRunner`, nothing submitted. |
| `SharePanel.tsx` | Public link, copy, publish / unpublish. |

Workflow (logic) and Connect (integrations) are "Coming soon" placeholders,
as are File upload and Payment in the question picker.

## Results (`src/components/results/`)

| File | Job |
|---|---|
| `Results.tsx` | Loads the form, responses and summary; Summary and Responses tabs; CSV download. |
| `Insights.tsx` | Responses, started, completion rate, average time to complete. |
| `SummaryCard.tsx` | Per question: answer-share bars for choices and yes/no, average plus distribution for ratings, average/min/max for numbers, latest answers for text. |
| `ResponsesTable.tsx` | One row per submission; click or Enter opens it. |
| `ResponseDrawer.tsx` | A full response, ↑/↓ to step through, Esc to close. Shows answers to since-deleted questions separately. |
