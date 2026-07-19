import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Check, MessageSquare, ShieldCheck } from "lucide-react";
import { getDemoReview } from "@/lib/demo-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Private review | RelayFrame",
  robots: { index: false, follow: false, noarchive: true },
  referrer: "no-referrer",
};

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const review = getDemoReview(token);
  if (!review) notFound();

  return (
    <main className="review-page">
      <header>
        <div className="brand-lockup review-logo">
          <span className="brand-symbol"><span /><span /></span>
          <b>RelayFrame</b>
        </div>
        <span><ShieldCheck size={14} /> Private review</span>
      </header>
      <section className="review-hero">
        <p>Shared by {review.organization.name}</p>
        <h1>{review.project.name}</h1>
        <span>{review.project.objective}</span>
      </section>
      <section className="review-content">
        <div className="review-heading">
          <div><p>Approved strategy</p><h2>Creative concepts</h2></div>
          <span>{review.testCards.length} selected</span>
        </div>
        <div className="review-card-grid">
          {review.testCards.map((card, index) => (
            <article key={card.id}>
              <span>0{index + 1}</span>
              <p>{card.strategy.replaceAll("_", " ")}</p>
              <h3>{card.title}</h3>
              <blockquote>“{card.hook}”</blockquote>
              <div><Check size={13} /> Approved for storyboard</div>
            </article>
          ))}
        </div>
        <div className="review-heading storyboard-review-heading">
          <div><p>Pre-production</p><h2>Storyboard frames</h2></div>
        </div>
        <div className="review-storyboards">
          {review.storyboardFrames.map((frame) => (
            <article key={frame.id}>
              <div
                style={{ backgroundImage: `url("${frame.imageUrl}")` }}
                role="img"
                aria-label={frame.shot}
              />
              <span>Frame {frame.ordinal + 1}</span>
              <b>{frame.shot}</b>
              <small>{frame.camera}</small>
            </article>
          ))}
        </div>
      </section>
      <footer>
        <MessageSquare size={15} />
        Review links are read-only in this MVP. Comments and identity verification
        are the next production integration.
      </footer>
    </main>
  );
}
