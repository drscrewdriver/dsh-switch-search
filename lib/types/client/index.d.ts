/**
 * dsh-session-search-toggle client half: a `sidebar.footer.action` entry that opens a
 * floating search panel over the sidebar. The panel has two modes:
 *
 * - 标题搜索 — lists every session (title + cwd) from the host route and
 *   filters by title/cwd substring locally.
 * - 内容搜索 — FTS5 message-content search through the host route, grouped by
 *   session: each row shows the session title and its strongest snippet.
 *
 * The panel is portalled to document.body so it never fights the sidebar
 * column's clip; positioning anchors to the trigger button's box. Clicking a
 * result opens that session and closes the panel.
 */
import { type ReactElement } from 'react';
import type { Context } from 'cordis';
/** ------------------------------------------------------------------ types */
/** The client slots service face (structural subset used here). */
interface SwitchSlotsService {
    inject(key: string, callback: () => () => void): () => void;
    register(options: {
        name: string;
        id?: string;
        order?: number;
    }, component: (props: SwitchFooterProps) => ReactElement): () => void;
}
/** The client sessions service face: open a session from a search result. */
interface SwitchSessionsService {
    open(id: string): void;
}
/** The footer-action owner share (structural subset). */
interface SwitchFooterProps {
    wide: boolean;
}
declare module 'cordis' {
    interface Context {
        slots: SwitchSlotsService;
        sessions?: SwitchSessionsService;
    }
}
/** ------------------------------------------------------------------ plugin */
/** Services required before mounting: the slot registry. */
export declare const inject: string[];
/**
 * Client plugin body: inject the stylesheet and register the footer entry.
 * @param ctx - client plugin context (slots, sessions).
 */
export declare function apply(ctx: Context): void;
export {};
//# sourceMappingURL=index.d.ts.map