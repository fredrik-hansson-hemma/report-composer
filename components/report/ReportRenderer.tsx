"use client";

/**
 * ReportRenderer
 *
 * Renders a saved BlockNote JSON document as a read-only HTML page.
 * Handles all block types used in the editor, including custom ones.
 *
 * For print: charts are rendered by Highcharts (SVG), which browsers
 * print reasonably well. Page-break hints are added via CSS classes.
 */

import dynamic from "next/dynamic";
import { getChartOptionsFromUrl } from "@/lib/mockChartData";

// Highcharts is browser-only
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

// ── Inline text renderer ──────────────────────────────────────────────────────

interface InlineContent {
  type: string;
  text?: string;
  styles?: Record<string, boolean | string>;
  href?: string;
  content?: InlineContent[];
}

function InlineText({ content }: { content: InlineContent[] }) {
  return (
    <>
      {content.map((item, i) => {
        if (item.type === "link") {
          return (
            <a key={i} href={item.href ?? "#"} className="report-link">
              <InlineText content={item.content ?? []} />
            </a>
          );
        }
        let el: React.ReactNode = item.text ?? "";
        if (item.styles?.bold) el = <strong key="b">{el}</strong>;
        if (item.styles?.italic) el = <em key="i">{el}</em>;
        if (item.styles?.underline) el = <u key="u">{el}</u>;
        if (item.styles?.strike) el = <s key="s">{el}</s>;
        if (item.styles?.code) el = <code key="c">{el}</code>;
        return <span key={i}>{el}</span>;
      })}
    </>
  );
}

// ── Chart component ───────────────────────────────────────────────────────────

function RenderedChart({ url, caption }: { url: string; caption?: string }) {
  if (!url) return null;
  const options = getChartOptionsFromUrl(url);
  return (
    <figure className="report-figure">
      <div className="report-chart">
        <HighchartsReact
          highcharts={Highcharts}
          options={options}
          containerProps={{ style: { width: "100%" } }}
        />
      </div>
      {caption && <figcaption className="report-caption">{caption}</figcaption>}
    </figure>
  );
}

// ── Table renderer ────────────────────────────────────────────────────────────

interface TableCell {
  content: InlineContent[];
}
interface TableRow {
  cells: TableCell[];
}
interface TableContent {
  type: "tableContent";
  rows: TableRow[];
}

function RenderedTable({ content }: { content: TableContent }) {
  const rows = content?.rows ?? [];
  return (
    <div className="report-table-wrap">
      <table className="report-table">
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.cells.map((cell, ci) => {
                const Tag = ri === 0 ? "th" : "td";
                return (
                  <Tag key={ci}>
                    <InlineText content={cell.content ?? []} />
                  </Tag>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Block renderer ────────────────────────────────────────────────────────────

interface Block {
  id: string;
  type: string;
  props: Record<string, string | number | boolean | null | undefined>;
  content: unknown;
  children: Block[];
}

function BlockRenderer({ block }: { block: Block }) {
  const content = block.content as InlineContent[];
  const children = block.children ?? [];

  switch (block.type) {
    case "paragraph":
      return (
        <p className="report-p">
          <InlineText content={content ?? []} />
          {children.length > 0 && <BlockList blocks={children} />}
        </p>
      );

    case "heading": {
      const level = (block.props.level as number) ?? 1;
      const Tag = `h${level}` as "h1" | "h2" | "h3";
      return (
        <Tag className={`report-h report-h${level}`}>
          <InlineText content={content ?? []} />
        </Tag>
      );
    }

    case "bulletListItem":
      return (
        <li className="report-li">
          <InlineText content={content ?? []} />
          {children.length > 0 && (
            <ul className="report-ul">
              <BlockList blocks={children} />
            </ul>
          )}
        </li>
      );

    case "numberedListItem":
      return (
        <li className="report-li">
          <InlineText content={content ?? []} />
          {children.length > 0 && (
            <ol className="report-ol">
              <BlockList blocks={children} />
            </ol>
          )}
        </li>
      );

    case "image": {
      const imgUrl = String(block.props.url ?? "");
      const imgCaption = block.props.caption ? String(block.props.caption) : null;
      return (
        <figure className="report-figure">
          {/* Next.js <Image> requires known dimensions; plain img is fine for PoC */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgUrl} alt={imgCaption ?? ""} className="report-img" />
          {imgCaption && (
            <figcaption className="report-caption">{imgCaption}</figcaption>
          )}
        </figure>
      );
    }

    case "table":
      return <RenderedTable content={block.content as TableContent} />;

    case "chart": {
      const chartUrl = String(block.props.url ?? "");
      const chartCaption = block.props.caption ? String(block.props.caption) : undefined;
      return <RenderedChart url={chartUrl} caption={chartCaption} />;
    }

    case "twoColumn": {
      const leftUrl = String(block.props.leftUrl ?? "");
      const leftCaption = block.props.leftCaption ? String(block.props.leftCaption) : undefined;
      const rightUrl = String(block.props.rightUrl ?? "");
      const rightCaption = block.props.rightCaption ? String(block.props.rightCaption) : undefined;
      return (
        <div className="report-two-col">
          <RenderedChart url={leftUrl} caption={leftCaption} />
          <RenderedChart url={rightUrl} caption={rightCaption} />
        </div>
      );
    }

    default:
      return null;
  }
}

// Group consecutive list items into proper <ul>/<ol> wrappers
function BlockList({ blocks }: { blocks: Block[] }) {
  const result: React.ReactNode[] = [];
  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i];
    if (block.type === "bulletListItem") {
      const group: Block[] = [];
      while (i < blocks.length && blocks[i].type === "bulletListItem") {
        group.push(blocks[i++]);
      }
      result.push(
        <ul key={`ul-${i}`} className="report-ul">
          {group.map((b) => (
            <BlockRenderer key={b.id} block={b} />
          ))}
        </ul>
      );
    } else if (block.type === "numberedListItem") {
      const group: Block[] = [];
      while (i < blocks.length && blocks[i].type === "numberedListItem") {
        group.push(blocks[i++]);
      }
      result.push(
        <ol key={`ol-${i}`} className="report-ol">
          {group.map((b) => (
            <BlockRenderer key={b.id} block={b} />
          ))}
        </ol>
      );
    } else {
      result.push(<BlockRenderer key={block.id} block={block} />);
      i++;
    }
  }
  return <>{result}</>;
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function ReportRenderer({ blocks }: { blocks: unknown[] }) {
  return (
    <article className="report-body">
      <BlockList blocks={blocks as Block[]} />
    </article>
  );
}
