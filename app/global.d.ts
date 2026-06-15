declare module 'hono' {
  interface ContextRenderer {
    (content: string | Promise<string>, head?: Head): Response | Promise<Response>;
  }
}
