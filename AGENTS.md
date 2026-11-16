<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- The active SugarApp interface uses `src/components/sugarapp` and `src/lib/sugarapp-store.ts`; legacy SugarMilk modules remain inactive to avoid overwriting prior device data.
- Keep SugarApp device persistence versioned and separate from legacy storage; writes must succeed before publishing state to subscribers so quota errors never falsely report success.
- Completed sales snapshot size, price, HPP, and recipe; later menu or cup changes affect only future orders to preserve historical accounting.
- Recipes use base ml/grams and count units, converted to inventory units before stock deduction; sales and multi-item waste reject insufficient stock atomically.
- Use the existing TanStack route for the five in-app views and keep POS mounted across navigation so unfinished carts are preserved.
- Sales capture consumed stock quantities and units; corrections restore the old consumption then validate and deduct the replacement atomically so edits cannot corrupt stock or accounting. Legacy sales derive consumption from their historical lines, and demo rows never restore unconsumed stock.
- Share report aggregation and delayed object-URL cleanup in a browser-safe utility so filters and downloads behave consistently.
- Persist record-change webhook events in the same device-state write as accounting changes, then dispatch serially with stable event IDs; opaque Google Apps Script responses are dispatch-only, not confirmed delivery.
- Sheets rows use ID-first type-specific schemas (sales nine columns, expenses seven, waste six); manual sync upserts all current records, and every dispatch path clears loading in finally to prevent stale device status.
- Keep expense restock snapshots with quantities, units and previous unit cost; corrections undo restocks atomically and reject negative inventory before changing accounting.
- Consolidate original-milk choices only in the POS projection, preserving existing menu IDs, owner pricing and historical sales; snapshot sweetness in each new line.
