"use client";

// Adapted from Bencho Action node (MIT): https://bencho.dev/licence
import { useI18n } from "@/components/preferences/PreferencesProvider";
import { useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { GitCommitHorizontal, Plus, type LucideIcon } from "lucide-react";

/* the button and half of it. Everything else that has a size
   is measured off this one — the spacing, the hiding place,
   the air the block keeps — so the buttons grow by changing
   this number and nothing else. */
const DOT = 36;
const R = DOT / 2;

/* centre to centre along the path. A real distance rather
   than an angle, which is the point of laying these out by
   arc length: twelve pixels of air between two buttons is
   twelve pixels whatever the corner is doing. */
const SPACING = DOT + 12;

/* ── they ride the card's OWN corner, offset ───────────────
   The path is the card's outline pushed out by a constant
   distance: straight along the top edge, round the corner on
   an arc concentric with it, straight down the right edge.
   Buttons are placed by how far along that path they are.

   ── WHY NOT A CIRCLE STRUCK FROM ONE POINT ──────────────
   That is what this was, with the centre parked 26px inside
   the corner, and it only looked right at one corner radius —
   the 18 it was tuned against. Square the card off and the
   card's material comes out to meet a path that has not
   moved: measured at Corner 0, the middle button cleared the
   corner by 2px while the ones at the ends of the fan still
   had thirteen. Round it right up and the opposite happens.

   A circle also cannot go round more than the quarter between
   the two edges. Past that the buttons carry on rotating away
   from an edge that has stopped curving, and a wide fan put
   its end buttons THROUGH the card's top edge.

   An offset path has neither problem because it is the card's
   own shape: every point on it is exactly `gap` from the
   nearest card surface, corner or edge, at every radius.

   ── how far along the path a button sits ────────────────
   `s` is arc length measured from where the corner arc meets
   the top edge, so the corner occupies 0..len and anything
   outside that has run onto a straight. Returns the point and
   the direction out of the card there, which is what the
   button slides along when it opens. */
function ride(s: number, corner: number, off: number) {
  /* the offset arc is concentric with the card's, so its
     radius is the card's plus the offset — and floored just
     above zero for a square card, where the corner is a
     point and the arc is a quarter turn about it */
  const arc = Math.max(0.001, corner + off);
  const len = (arc * Math.PI) / 2;
  if (s <= 0) {
    /* along the top edge, going left */
    return { x: -corner + s, y: -off, nx: 0, ny: -1 };
  }
  if (s >= len) {
    /* down the right edge */
    return { x: off, y: corner + (s - len), nx: 1, ny: 0 };
  }
  const th = Math.PI / 2 - s / arc;
  return {
    x: -corner + arc * Math.cos(th),
    y: corner - arc * Math.sin(th),
    nx: Math.cos(th),
    ny: -Math.sin(th),
  };
}


export type NodeAction = { id: string; label: string; icon: LucideIcon; onClick: () => void };

export function ActionNode({ title, description, actions, disabled = false, children, className = "" }: {
  title: string; description: string; actions: NodeAction[]; disabled?: boolean; children?: ReactNode; className?: string;
}) {
 const { t } = useI18n();

  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const still = useReducedMotion();
  const count = Math.min(actions.length, 4);
  const corner = 20;
  const off = 16 + R;
  const mid = ((corner + off) * Math.PI) / 4;

  return <div className={`mind-node ${className}`}
    onPointerEnter={() => setOpen(true)}
    onPointerLeave={(event) => { if (!event.currentTarget.contains(document.activeElement)) setOpen(false); }}
    onFocus={() => setOpen(true)}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
    onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); trigger.current?.focus(); setOpen(false); } }}>
    <div className="mind-node-card">
      {children || <><div className="mind-node-top"><GitCommitHorizontal size={18} /><h2>{title}</h2></div><p>{description}</p></>}
      <button ref={trigger} type="button" className="mind-node-trigger" aria-label={t("Mostrar ações do prompt")} aria-expanded={open} onClick={() => setOpen(true)}><Plus size={18} /></button>
    </div>
    {/* Anchored ON the corner, so every button's travel is
        measured from the one point they all came out of.
        The controls fold back into their own card. */}
    <div className="mind-node-fan">
      {/* The air between the card and its fan needs a hit area:
          otherwise crossing the gap closes actions under the cursor. */}
      {open && <span aria-hidden="true" className="mind-node-reach" />}
      {actions.slice(0, count).map((action, index) => {
        const spot = ride(mid + (index - (count - 1) / 2) * SPACING, corner, off);
        return <motion.button key={action.id} type="button" className="mind-node-action" aria-label={action.label} title={action.label}
          tabIndex={open ? 0 : -1} disabled={disabled}
          initial={false} animate={{ x: open ? spot.x : -24, y: open ? spot.y : 24, scale: open ? 1 : 0.5, opacity: open ? 1 : 0 }}
          transition={still ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 26, delay: open ? index * 0.035 : (count - index - 1) * 0.035 }}
          style={{ width: DOT, height: DOT, marginLeft: -R, marginTop: -R, pointerEvents: open ? "auto" : "none" }} onClick={action.onClick}>
          <action.icon size={16} />
        </motion.button>;
      })}
    </div>
  </div>;
}
