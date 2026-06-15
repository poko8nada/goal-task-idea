import { jsxRenderer } from 'hono/jsx-renderer';

export default jsxRenderer(({ children }) => {
  return (
    <html lang='ja'>
      <head>
        <meta charset='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <title>Goal Task Idea</title>
        <link rel='stylesheet' href='/app/style.css' />
        {import.meta.env.PROD ? (
          <script type='module' src='/static/client.js'></script>
        ) : (
          <script type='module' src='/app/client.ts'></script>
        )}
      </head>
      <body>{children}</body>
    </html>
  );
});
