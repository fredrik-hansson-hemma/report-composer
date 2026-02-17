"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import {
  BlockNoteSchema,
  defaultBlockSpecs,
  filterSuggestionItems,
} from "@blocknote/core";
import {
  FormattingToolbar,
  FormattingToolbarController,
  BasicTextStyleButton,
  BlockTypeSelect,
  CreateLinkButton,
  NestBlockButton,
  UnnestBlockButton,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
  useCreateBlockNote,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { MantineProvider } from "@mantine/core";
import { useCallback, useEffect, useRef } from "react";
import { ChartBlock } from "./blocks/ChartBlock";
import { TwoColumnBlock } from "./blocks/TwoColumnBlock";

// ── Schema ────────────────────────────────────────────────────────────────────
const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    chart: ChartBlock,
    twoColumn: TwoColumnBlock,
  },
});

// ── Custom slash menu items ───────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCustomSlashItems(editor: ReturnType<typeof useCreateBlockNote<any>>) {
  return [
    ...getDefaultReactSlashMenuItems(editor),
    {
      title: "Diagram",
      onItemClick: () => {
        const pos = editor.getTextCursorPosition();
        editor.insertBlocks(
          [{ type: "chart" as const, props: { url: "", caption: "" } }],
          pos.block,
          "after"
        );
      },
      group: "Media",
      icon: (
        <span style={{ fontSize: 18, lineHeight: 1 }}>📊</span>
      ),
      subtext: "Infoga Highcharts-diagram via URL",
      aliases: ["diagram", "chart", "highcharts", "visualisering"],
      badge: undefined,
    },
    {
      title: "Två kolumner",
      onItemClick: () => {
        const pos = editor.getTextCursorPosition();
        editor.insertBlocks(
          [
            {
              type: "twoColumn" as const,
              props: {
                leftUrl: "",
                leftCaption: "",
                rightUrl: "",
                rightCaption: "",
              },
            },
          ],
          pos.block,
          "after"
        );
      },
      group: "Layout",
      icon: (
        <span style={{ fontSize: 18, lineHeight: 1 }}>⬜⬜</span>
      ),
      subtext: "Visa två diagram sida vid sida",
      aliases: ["kolumner", "column", "twoColumn", "layout", "sida"],
      badge: undefined,
    },
  ];
}

// ── Limited formatting toolbar ────────────────────────────────────────────────
function LimitedFormattingToolbar() {
  return (
    <FormattingToolbar>
      <BlockTypeSelect key="blockTypeSelect" />
      <BasicTextStyleButton basicTextStyle="bold" key="boldStyleButton" />
      <BasicTextStyleButton basicTextStyle="italic" key="italicStyleButton" />
      <CreateLinkButton key="createLinkButton" />
      <NestBlockButton key="nestBlockButton" />
      <UnnestBlockButton key="unnestBlockButton" />
    </FormattingToolbar>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface ReportEditorProps {
  initialContent?: unknown[];
  onChange?: (content: unknown[]) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ReportEditor({
  initialContent,
  onChange,
}: ReportEditorProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useCreateBlockNote({
    schema,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(initialContent && initialContent.length > 0 ? { initialContent: initialContent as any } : {}),
  });

  const handleChange = useCallback(() => {
    if (!onChange) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange(editor.document as unknown[]);
    }, 600);
  }, [editor, onChange]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <MantineProvider>
      <BlockNoteView
        editor={editor}
        theme="light"
        onChange={handleChange}
        formattingToolbar={false}
        slashMenu={false}
      >
        {/* Custom limited formatting toolbar */}
        <FormattingToolbarController
          formattingToolbar={LimitedFormattingToolbar}
        />

        {/* Custom slash menu with chart + two-column items */}
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) =>
            filterSuggestionItems(getCustomSlashItems(editor), query)
          }
        />
      </BlockNoteView>
    </MantineProvider>
  );
}
