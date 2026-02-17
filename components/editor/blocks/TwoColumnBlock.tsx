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

// ── Single column sub-component ───────────────────────────────────────────────

function ChartColumn({
  url,
  caption,
  isEditable,
  label,
  onCommit,
}: {
  url: string;
  caption: string;
  isEditable: boolean;
  label: string;
  onCommit: (url: string, caption: string) => void;
}) {
  const [inputUrl, setInputUrl] = useState(url);
  const [inputCaption, setInputCaption] = useState(caption);
  const [options, setOptions] = useState<object | null>(null);

  useEffect(() => {
    setInputUrl(url);
    setInputCaption(caption);
  }, [url, caption]);

  useEffect(() => {
    setOptions(url ? getChartOptionsFromUrl(url) : null);
  }, [url]);

  const commit = (u: string, c: string) => onCommit(u, c);

  return (
    <div className="two-col-column">
      {isEditable && (
        <div className="chart-url-row">
          <span className="chart-col-label">{label}</span>
          <input
            className="chart-url-input"
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit(inputUrl, inputCaption);
              }
            }}
            placeholder="Diagram-URL…"
          />
          <button className="chart-url-btn" onClick={() => commit(inputUrl, inputCaption)}>
            Visa
          </button>
          {url && (
            <button
              className="chart-url-btn chart-url-btn--ghost"
              onClick={() => {
                setInputUrl("");
                commit("", inputCaption);
              }}
            >
              ✕
            </button>
          )}
        </div>
      )}

      {options ? (
        <div className="chart-container">
          <HighchartsReact
            highcharts={Highcharts}
            options={options}
            containerProps={{ style: { width: "100%" } }}
          />
        </div>
      ) : (
        <div className="chart-placeholder chart-placeholder--small">
          {isEditable ? "↑ Klistra in diagram-URL" : "Inget diagram"}
        </div>
      )}

      {isEditable ? (
        <input
          className="chart-caption-input"
          type="text"
          value={inputCaption}
          onChange={(e) => setInputCaption(e.target.value)}
          onBlur={() => commit(inputUrl, inputCaption)}
          placeholder="Bildtext…"
        />
      ) : (
        inputCaption && <p className="chart-caption">{inputCaption}</p>
      )}
    </div>
  );
}

// ── Inner component for TwoColumn (same hooks-in-render workaround) ───────────

interface TwoColBlockProps {
  block: {
    id: string;
    props: {
      leftUrl: string;
      leftCaption: string;
      rightUrl: string;
      rightCaption: string;
    };
  };
  editor: {
    isEditable: boolean;
    updateBlock: (
      block: { id: string },
      update: { props: Partial<{ leftUrl: string; leftCaption: string; rightUrl: string; rightCaption: string }> }
    ) => void;
  };
}

function TwoColumnBlockContent({ block, editor }: TwoColBlockProps) {
  const isEditable = editor.isEditable;
  const { leftUrl, leftCaption, rightUrl, rightCaption } = block.props;

  return (
    <div className="two-col-block">
      <ChartColumn
        url={leftUrl}
        caption={leftCaption}
        isEditable={isEditable}
        label="Vänster"
        onCommit={(u, c) => editor.updateBlock(block, { props: { leftUrl: u, leftCaption: c } })}
      />
      <ChartColumn
        url={rightUrl}
        caption={rightCaption}
        isEditable={isEditable}
        label="Höger"
        onCommit={(u, c) => editor.updateBlock(block, { props: { rightUrl: u, rightCaption: c } })}
      />
    </div>
  );
}

export const TwoColumnBlock = createReactBlockSpec(
  {
    type: "twoColumn" as const,
    propSchema: {
      leftUrl: { default: "" },
      leftCaption: { default: "" },
      rightUrl: { default: "" },
      rightCaption: { default: "" },
    },
    content: "none" as const,
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render: (props: any) => <TwoColumnBlockContent block={props.block} editor={props.editor} />,
  }
);
