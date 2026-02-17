"use client";

import { createReactBlockSpec } from "@blocknote/react";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { getChartOptionsFromUrl } from "@/lib/mockChartData";

const HighchartsReact = dynamic(() => import("highcharts-react-official"), {
  ssr: false,
  loading: () => <div className="chart-loading">Laddar diagram…</div>,
});

let Highcharts: typeof import("highcharts") | null = null;
if (typeof window !== "undefined") {
  import("highcharts").then((m) => {
    Highcharts = m.default;
  });
}

// ── Inner component (hooks need to live in a named React component) ────────────
interface ChartBlockProps {
  block: {
    id: string;
    props: { url: string; caption: string };
  };
  editor: {
    isEditable: boolean;
    updateBlock: (block: { id: string }, update: { props: Partial<{ url: string; caption: string }> }) => void;
  };
}

function ChartBlockContent({ block, editor }: ChartBlockProps) {
  const [inputUrl, setInputUrl] = useState(block.props.url);
  const [caption, setCaption] = useState(block.props.caption);
  const [chartOptions, setChartOptions] = useState<object | null>(null);
  const isEditable = editor.isEditable;

  useEffect(() => {
    setInputUrl(block.props.url);
    setCaption(block.props.caption);
  }, [block.props.url, block.props.caption]);

  useEffect(() => {
    setChartOptions(block.props.url ? getChartOptionsFromUrl(block.props.url) : null);
  }, [block.props.url]);

  const commit = (url: string, cap: string) => {
    editor.updateBlock(block, { props: { url, caption: cap } });
  };

  return (
    <div className="chart-block" data-url={block.props.url}>
      {isEditable && (
        <div className="chart-url-row">
          <input
            className="chart-url-input"
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit(inputUrl, caption);
              }
            }}
            placeholder="Klistra in diagram-URL, t.ex. /visualisering?typ=linje&indikator=overlevnad"
          />
          <button className="chart-url-btn" onClick={() => commit(inputUrl, caption)}>
            Visa diagram
          </button>
          {block.props.url && (
            <button
              className="chart-url-btn chart-url-btn--ghost"
              onClick={() => {
                setInputUrl("");
                commit("", caption);
              }}
            >
              ✕
            </button>
          )}
        </div>
      )}

      {chartOptions ? (
        <div className="chart-container">
          <HighchartsReact
            highcharts={Highcharts}
            options={chartOptions}
            containerProps={{ style: { width: "100%" } }}
          />
        </div>
      ) : (
        <div className="chart-placeholder">
          {isEditable ? "↑ Klistra in en diagram-URL ovan" : "Inget diagram konfigurerat"}
        </div>
      )}

      {isEditable ? (
        <input
          className="chart-caption-input"
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={() => commit(inputUrl, caption)}
          placeholder="Bildtext (valfri)…"
        />
      ) : (
        caption && <p className="chart-caption">{caption}</p>
      )}
    </div>
  );
}

export const ChartBlock = createReactBlockSpec(
  {
    type: "chart" as const,
    propSchema: {
      url: { default: "" },
      caption: { default: "" },
    },
    content: "none" as const,
  },
  {
    // Delegate to a named component so React hooks rules are satisfied
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render: (props: any) => <ChartBlockContent block={props.block} editor={props.editor} />,
  }
);
