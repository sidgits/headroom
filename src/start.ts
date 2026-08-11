import * as Start from "@tanstack/react-start";
import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests. Resolved defensively: some bundled builds of
// @tanstack/react-start don't expose the helper, and a hard reference there
// crashes every SSR request with "createCsrfMiddleware is not a function".
const createCsrf = (Start as unknown as Record<string, unknown>)[
  "createCsrfMiddleware"
] as ((opts: { filter: (ctx: { handlerType: string }) => boolean }) => unknown) | undefined;

const csrfMiddleware =
  typeof createCsrf === "function"
    ? createCsrf({ filter: (ctx) => ctx.handlerType === "serverFn" })
    : undefined;

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, ...(csrfMiddleware ? [csrfMiddleware] : [])] as never,
}));
