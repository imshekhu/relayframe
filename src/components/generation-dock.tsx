"use client";

import { Check, Clock3, Image as ImageIcon, LoaderCircle } from "lucide-react";
import type { Asset, Generation } from "@/domain/types";

export function GenerationDock({
  generations,
  assets,
}: {
  generations: Generation[];
  assets: Asset[];
}) {
  const recent = generations.slice(0, 4);
  if (!recent.length) {
    return (
      <section className="generation-dock generation-dock-empty">
        <span><ImageIcon size={19} /></span>
        <div>
          <b>Your latest outputs will appear here</b>
          <p>Generate a concept without leaving the creative canvas.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="generation-dock" aria-label="Recent generations">
      <header>
        <div>
          <p>Live output dock</p>
          <h2>Recent creations</h2>
        </div>
        <span>{recent.length} jobs</span>
      </header>
      <div className="generation-dock-grid">
        {recent.map((generation) => {
          const output = assets.find(
            (asset) => asset.generationId === generation.id,
          );
          const running = !["completed", "failed", "rejected", "cancelled"].includes(
            generation.state,
          );
          return (
            <article key={generation.id}>
              {output ? (
                <div
                  className="dock-output"
                  style={{ backgroundImage: `url("${output.url}")` }}
                  role="img"
                  aria-label={output.name}
                />
              ) : (
                <div className="dock-placeholder">
                  {running ? (
                    <LoaderCircle size={21} className="dock-spinner" />
                  ) : (
                    <ImageIcon size={21} />
                  )}
                </div>
              )}
              <div className="dock-meta">
                <span>
                  {generation.state === "completed" ? (
                    <Check size={11} />
                  ) : (
                    <Clock3 size={11} />
                  )}
                  {generation.state.replaceAll("_", " ")}
                </span>
                <b>{generation.operation.replaceAll("_", " ")}</b>
                <progress
                  max={100}
                  value={generation.progress}
                  aria-label={`${generation.progress}% complete`}
                />
                <small>
                  {generation.consumedCredits || generation.reservedCredits} credits
                </small>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
