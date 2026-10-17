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

- Keep the existing localStorage key and migrate additively; write before committing UI state so quota failures cannot create unpersisted transactions.
- Share receipt markup and thermal CSS between settings preview and browser printing so both checkout and report reprints honor the same settings.
- Keep barcode/image helpers browser-safe at import time; load camera decoding only when scanning starts and stop every media track on close.
