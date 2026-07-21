import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { getBaseUrl, getMcpResourceUrl } from "@/lib/env";
import { verifyMcpToken } from "@/lib/mcp-auth";
import {
  downloadPinterestImage,
  getBestPinImage,
  getBoard,
  getPin,
  listBoardPins,
  listBoards,
  pinSummary,
} from "@/lib/pinterest";
import type { PinterestPin } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};

function connectionIdFromExtra(extra: unknown): string {
  const value = (extra as {
    authInfo?: { extra?: { connectionId?: unknown } };
  })?.authInfo?.extra?.connectionId;
  if (typeof value !== "string" || !value) {
    throw new Error("Pinterest connection is missing. Reconnect the MCP app.");
  }
  return value;
}

function jsonText(value: unknown): { type: "text"; text: string } {
  return { type: "text", text: JSON.stringify(value, null, 2) };
}

function matchesQuery(pin: PinterestPin, query: string): boolean {
  const haystack = [pin.title, pin.description, pin.alt_text, pin.link]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "list_pinterest_boards",
      {
        title: "List Pinterest boards",
        description:
          "List the connected user's Pinterest boards. Use this first to discover inspiration collections and board IDs.",
        inputSchema: {
          page_size: z.number().int().min(1).max(100).default(25),
          bookmark: z.string().optional(),
          privacy: z.enum(["PUBLIC", "PROTECTED", "SECRET"]).optional(),
        },
        annotations: readOnlyAnnotations,
      },
      async ({ page_size, bookmark, privacy }, extra) => {
        const page = await listBoards(
          connectionIdFromExtra(extra),
          page_size,
          bookmark,
          privacy,
        );
        return {
          content: [
            jsonText({
              boards: page.items.map((board) => ({
                id: board.id,
                name: board.name ?? null,
                description: board.description ?? null,
                privacy: board.privacy ?? null,
                pin_count: board.pin_count ?? null,
              })),
              next_bookmark: page.bookmark ?? null,
            }),
          ],
        };
      },
    );

    server.registerTool(
      "get_pinterest_board",
      {
        title: "Get Pinterest board",
        description: "Get metadata for one Pinterest board by ID.",
        inputSchema: { board_id: z.string().min(1) },
        annotations: readOnlyAnnotations,
      },
      async ({ board_id }, extra) => ({
        content: [jsonText(await getBoard(connectionIdFromExtra(extra), board_id))],
      }),
    );

    server.registerTool(
      "list_board_pins",
      {
        title: "List board Pins",
        description:
          "List Pin metadata and image URLs from one board. Use get_board_inspiration_images when visual analysis is needed.",
        inputSchema: {
          board_id: z.string().min(1),
          page_size: z.number().int().min(1).max(100).default(25),
          bookmark: z.string().optional(),
        },
        annotations: readOnlyAnnotations,
      },
      async ({ board_id, page_size, bookmark }, extra) => {
        const page = await listBoardPins(
          connectionIdFromExtra(extra),
          board_id,
          page_size,
          bookmark,
        );
        return {
          content: [
            jsonText({
              pins: page.items.map(pinSummary),
              next_bookmark: page.bookmark ?? null,
            }),
          ],
        };
      },
    );

    server.registerTool(
      "get_pin_details",
      {
        title: "Get Pin details",
        description: "Get complete metadata for a single saved Pinterest Pin.",
        inputSchema: { pin_id: z.string().min(1) },
        annotations: readOnlyAnnotations,
      },
      async ({ pin_id }, extra) => ({
        content: [jsonText(await getPin(connectionIdFromExtra(extra), pin_id))],
      }),
    );

    server.registerTool(
      "get_board_inspiration_images",
      {
        title: "Load board inspiration images",
        description:
          "Load actual images from a Pinterest board into the conversation for visual analysis. Ideal before writing Instagram concepts, captions, carousels, art direction, or image prompts.",
        inputSchema: {
          board_id: z.string().min(1),
          limit: z.number().int().min(1).max(8).default(6),
          bookmark: z.string().optional(),
        },
        annotations: readOnlyAnnotations,
      },
      async ({ board_id, limit, bookmark }, extra) => {
        const connectionId = connectionIdFromExtra(extra);
        const page = await listBoardPins(connectionId, board_id, limit, bookmark);
        const content: Array<Record<string, unknown>> = [
          jsonText({
            board_id,
            pins: page.items.map(pinSummary),
            next_bookmark: page.bookmark ?? null,
            instruction:
              "The following images are the user's saved visual references. Analyze composition, typography, palette, layout, photography, styling, and recurring motifs.",
          }),
        ];

        for (const pin of page.items) {
          const image = getBestPinImage(pin);
          if (!image?.url) continue;
          try {
            const downloaded = await downloadPinterestImage(image.url);
            content.push({
              type: "text",
              text: `Pinterest Pin ${pin.id}${pin.title ? ` — ${pin.title}` : ""}`,
            });
            content.push({
              type: "image",
              data: downloaded.data,
              mimeType: downloaded.mimeType,
            });
          } catch (error) {
            content.push({
              type: "text",
              text: `Could not load image for Pin ${pin.id}: ${
                error instanceof Error ? error.message : "Unknown image error"
              }`,
            });
          }
        }

        return { content: content as never };
      },
    );

    server.registerTool(
      "search_saved_pin_metadata",
      {
        title: "Search saved Pin metadata",
        description:
          "Best-effort keyword search over Pin titles, descriptions, alt text, and links. Searches the first page of Pins in selected boards; it is not Pinterest's global visual search.",
        inputSchema: {
          query: z.string().min(1),
          board_ids: z.array(z.string().min(1)).max(12).optional(),
          max_boards: z.number().int().min(1).max(12).default(8),
          pins_per_board: z.number().int().min(1).max(100).default(50),
          limit: z.number().int().min(1).max(30).default(12),
        },
        annotations: readOnlyAnnotations,
      },
      async (
        { query, board_ids, max_boards, pins_per_board, limit },
        extra,
      ) => {
        const connectionId = connectionIdFromExtra(extra);
        const selectedBoardIds = board_ids?.length
          ? board_ids
          : (await listBoards(connectionId, max_boards)).items.map((board) => board.id);

        const pages = await Promise.all(
          selectedBoardIds.slice(0, max_boards).map(async (boardId) => ({
            boardId,
            page: await listBoardPins(connectionId, boardId, pins_per_board),
          })),
        );

        const matches = pages
          .flatMap(({ boardId, page }) =>
            page.items
              .filter((pin) => matchesQuery(pin, query))
              .map((pin) => ({ ...pinSummary(pin), searched_board_id: boardId })),
          )
          .slice(0, limit);

        return {
          content: [
            jsonText({
              query,
              matches,
              searched_board_ids: selectedBoardIds.slice(0, max_boards),
              note:
                "This is metadata matching over a limited page from each board. Load a matching board with get_board_inspiration_images for visual analysis.",
            }),
          ],
        };
      },
    );
  },
  {
    serverInfo: {
      name: "Pinterest Inspiration MCP",
      version: "0.1.0",
    },
  },
  {
    basePath: "/api",
    maxDuration: 60,
    verboseLogs: false,
  },
);

const authHandler = withMcpAuth(handler, verifyMcpToken, {
  required: true,
  requiredScopes: ["pinterest.read"],
  resourceMetadataPath: "/.well-known/oauth-protected-resource",
  resourceUrl: getBaseUrl(),
});

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
