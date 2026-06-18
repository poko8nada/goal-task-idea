// HonoX 公式テンプレの型拡張。`c.render()` の戻り値型を `Response | Promise<Response>` として
// honox に伝える目的。pj 固有のグローバル型はここに追加する。
declare module 'hono' {
  interface ContextRenderer {
    (content: string | Promise<string>, head?: Head): Response | Promise<Response>;
  }
}
