"use client";

import { useEffect, useRef, useState } from "react";
import { EnquiryForm } from "./EnquiryForm";

/**
 * The piece page's enquiry: two actions, and the form opens in place beneath
 * them rather than in a modal. "Write to us" opens it with the appointment
 * choice available too; the mailto stays as the no-JS route.
 */
export function EnquiryReveal({
  piece,
  email,
}: {
  piece: { slug: string; name: string };
  email: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [open]);

  return (
    <div className="enquire">
      {!open && (
        <div className="piece__actions">
          <button type="button" className="btn" onClick={() => setOpen(true)} data-cursor="Enquire">
            <span>Enquire about this piece</span>
            <span className="btn__arrow" aria-hidden="true" />
          </button>
          <a
            href={`mailto:${email}?subject=${encodeURIComponent(`Enquiry — ${piece.name}`)}`}
            className="btn btn--ghost"
            onClick={(e) => {
              e.preventDefault();
              setOpen(true);
            }}
            data-cursor="Write"
          >
            <span>Write to us</span>
            <span className="btn__arrow" aria-hidden="true" />
          </a>
        </div>
      )}
      <div ref={ref} className={`enquire__panel${open ? " is-open" : ""}`} hidden={!open}>
        {open && (
          <>
            <h2 className="display-4" style={{ fontFamily: "var(--font-display)" }}>
              {piece.name}
            </h2>
            <EnquiryForm piece={piece} autoFocus />
          </>
        )}
      </div>
    </div>
  );
}
