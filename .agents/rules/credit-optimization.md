# Token & Credit Optimization Directives

LLM context windows and API tokens cost credits and latency. Follow these hard rules to minimize token consumption and maximize agent efficiency:

## 1. No Whole-File Dumps of Monolithic Files
- `src/render/MoviElement.ts` is ~15,000 lines long.
- `src/core/MoviPlayer.ts` is ~4,500 lines long.
- **NEVER** use `view_file` to read these files from line 1 to the end.
- **ALWAYS** use `grep_search` to pinpoint function names or variables first, then view only the specific 50–150 line slice needed.

## 2. Fast Orientation via `decisions/ACTIVE_CONTEXT.md`
- Instead of re-reading architecture docs, read [decisions/ACTIVE_CONTEXT.md](../../decisions/ACTIVE_CONTEXT.md) (<500 tokens). It contains the complete cheat sheet of hard-won invariants.

## 3. Targeted Edits
- When modifying files, prefer `replace_file_content` for single contiguous edits and `multi_replace_file_content` for precise multi-point edits.
- Never re-emit large unchanged files through `write_to_file` unless generating a new file or intentionally rewriting a small module (<200 lines).

## 4. Concise Communication & Artifact Usage
- Keep conversational responses focused on key decisions, links, and actionable commands.
- Put deep technical documentation, roadmaps, and detailed analysis into markdown artifacts, which persist cleanly without re-consuming chat context.

## 5. Verification Commands
- Use `npm run typecheck` (~3 seconds) for quick type safety checks instead of waiting for heavy bundle builds.
- Use `app/test-native.html` for targeted feature smoke-testing without the full dev environment overhead.
