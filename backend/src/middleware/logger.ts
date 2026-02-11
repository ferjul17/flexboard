import type { Context, Next } from 'hono';

export async function logger(c: Context, next: Next) {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  await next();

  const status = c.res.status;
  const duration = Date.now() - start;

  // Color codes for status
  let statusColor = '\x1b[32m'; // Green
  if (status >= 400 && status < 500) {
    statusColor = '\x1b[33m'; // Yellow
  } else if (status >= 500) {
    statusColor = '\x1b[31m'; // Red
  }

  console.log(`${method} ${path} ${statusColor}${status}\x1b[0m - ${duration}ms`);
}
