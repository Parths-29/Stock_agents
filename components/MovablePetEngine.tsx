"use client";
import { useState } from "react";
import PetAvatar from "./PetAvatar";
import { pets, type PetId } from "@/lib/market";
export default function MovablePetEngine({
  active,
  onSelect,
}: {
  active: PetId;
  onSelect: (id: PetId) => void;
}) {
  const [offsets, setOffsets] = useState<
    Record<string, { x: number; y: number }>
  >({});
  return (
    <section className="pet-habitat">
      <div className="habitat-label">
        <span className="dot" /> THE PAW FLOOR{" "}
        <small>DRAG YOUR COMPANIONS</small>
      </div>
      <div className="pet-floor">
        {pets.map((p, i) => (
          <button
            key={p.id}
            aria-label={`Select or drag ${p.name}`}
            className={`floor-pet ${active === p.id ? "chosen" : ""}`}
            style={{
              left: `${8 + i * 18}%`,
              transform: `translate(${offsets[p.id]?.x ?? 0}px, ${offsets[p.id]?.y ?? 0}px)`,
            }}
            onClick={() => onSelect(p.id)}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              e.currentTarget.dataset.startX = String(
                e.clientX - (offsets[p.id]?.x ?? 0),
              );
              e.currentTarget.dataset.startY = String(
                e.clientY - (offsets[p.id]?.y ?? 0),
              );
            }}
            onPointerMove={(e) => {
              if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
              setOffsets((old) => ({
                ...old,
                [p.id]: {
                  x: Math.max(
                    -50,
                    Math.min(
                      50,
                      e.clientX - Number(e.currentTarget.dataset.startX),
                    ),
                  ),
                  y: Math.max(
                    -35,
                    Math.min(
                      12,
                      e.clientY - Number(e.currentTarget.dataset.startY),
                    ),
                  ),
                },
              }));
            }}
            onPointerUp={(e) =>
              e.currentTarget.releasePointerCapture(e.pointerId)
            }
          >
            <span className="pet-bubble">
              {active === p.id
                ? p.motto
                : [
                    "Watching the tape.",
                    "On the lookout.",
                    "Running numbers.",
                    "Risk first.",
                    "Planning ahead.",
                  ][i]}
            </span>
            <span
              className="pet-body"
              style={{ animationDelay: `${i * -0.6}s` }}
            >
              <PetAvatar id={p.id} />
            </span>
            <span className="pet-name">
              {p.name}
              <i className="dot" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
