/**
 * Generates Highcharts options from a visualization URL.
 *
 * Real app: the URL points to an existing chart view, the block
 * would fetch metadata or render the chart via an iframe/API.
 * For the PoC we parse URL params and produce plausible mock data.
 *
 * Supported ?typ= values:
 *   linje  (default) – line chart over years
 *   stapel           – bar chart
 *   kaka             – pie chart
 *   spridning        – scatter plot
 */

import type { Options } from "highcharts";

// Seeded random so the same URL always gives the same numbers
function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function strSeed(str: string) {
  return Array.from(str).reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

const YEARS = [2018, 2019, 2020, 2021, 2022, 2023];
const REGIONS = ["Stockholms", "Västra Götalands", "Skånes", "Uppsala", "Östergötlands"];

function lineChart(indikator: string, enhet: string): Options {
  const rand = seededRand(strSeed(indikator + enhet));
  const base = 60 + rand() * 30;
  const series = REGIONS.slice(0, 3).map((region) => ({
    name: region + " region",
    type: "line" as const,
    data: YEARS.map(() => Math.round((base + rand() * 20 - 10) * 10) / 10),
  }));
  return {
    chart: { type: "line", height: 320 },
    title: { text: labelFromParam(indikator) },
    subtitle: { text: labelFromParam(enhet) },
    xAxis: { categories: YEARS.map(String) },
    yAxis: { title: { text: "Andel (%)" }, min: 0, max: 100 },
    legend: { enabled: true },
    series,
    credits: { enabled: false },
  };
}

function barChart(indikator: string, enhet: string): Options {
  const rand = seededRand(strSeed(indikator + enhet));
  return {
    chart: { type: "bar", height: 320 },
    title: { text: labelFromParam(indikator) },
    subtitle: { text: labelFromParam(enhet) },
    xAxis: { categories: REGIONS },
    yAxis: { title: { text: "Andel (%)" }, min: 0, max: 100 },
    series: [
      {
        name: String(YEARS[YEARS.length - 1]),
        type: "bar" as const,
        data: REGIONS.map(() => Math.round((40 + rand() * 50) * 10) / 10),
        color: "#1E66B4",
      },
    ],
    credits: { enabled: false },
  };
}

function pieChart(indikator: string): Options {
  const rand = seededRand(strSeed(indikator));
  const vals = [rand() * 40 + 20, rand() * 30 + 10, rand() * 20 + 5];
  const sum = vals.reduce((a, b) => a + b, 0);
  return {
    chart: { type: "pie", height: 320 },
    title: { text: labelFromParam(indikator) },
    series: [
      {
        name: "Andel",
        type: "pie" as const,
        data: [
          { name: "Utförd", y: Math.round((vals[0] / sum) * 100) },
          { name: "Ej utförd", y: Math.round((vals[1] / sum) * 100) },
          { name: "Okänd", y: Math.round((vals[2] / sum) * 100) },
        ],
      },
    ],
    credits: { enabled: false },
  };
}

function scatterChart(indikator: string): Options {
  const rand = seededRand(strSeed(indikator));
  const data = Array.from({ length: 20 }, () => [
    Math.round(rand() * 100),
    Math.round((rand() * 80 + 10) * 10) / 10,
  ]);
  return {
    chart: { type: "scatter", height: 320 },
    title: { text: labelFromParam(indikator) },
    xAxis: { title: { text: "Volym (antal fall)" } },
    yAxis: { title: { text: "Utfall (%)" }, min: 0, max: 100 },
    series: [
      {
        name: "Enhet",
        type: "scatter" as const,
        data,
        color: "#1E66B4",
      },
    ],
    credits: { enabled: false },
  };
}

function labelFromParam(param: string): string {
  return param
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getChartOptionsFromUrl(url: string): Options {
  let search = "";
  try {
    // Support both full URLs and path-only strings like /vis?typ=linje
    const normalized = url.startsWith("http") ? url : `http://localhost${url}`;
    search = new URL(normalized).search;
  } catch {
    search = url.includes("?") ? url.split("?")[1] : "";
  }
  const params = new URLSearchParams(search);
  const typ = params.get("typ") ?? "linje";
  const indikator = params.get("indikator") ?? "indikator";
  const enhet = params.get("enhet") ?? "riket";

  switch (typ) {
    case "stapel":
      return barChart(indikator, enhet);
    case "kaka":
    case "pie":
      return pieChart(indikator);
    case "spridning":
    case "scatter":
      return scatterChart(indikator);
    default:
      return lineChart(indikator, enhet);
  }
}
