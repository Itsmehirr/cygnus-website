"use client";

import { useActionState } from "react";
import { submitEnquiry, type FormState } from "@/app/actions";

const initial: FormState = { status: "idle" };

export function EnquiryForm({
  piece,
}: {
  piece: { slug: string; name: string };
}) {
  const [state, action, pending] = useActionState(submitEnquiry, initial);

  if (state.status === "success") {
    return (
      <div className="form__done stack" id="enquire">
        <p className="display-4" style={{ fontFamily: "var(--font-display)" }}>
          Thank you.
        </p>
        <p className="muted">
          Your enquiry about {piece.name} has reached the house. We reply
          personally and in order.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="form" id="enquire" noValidate>
      <input type="hidden" name="piece" value={piece.slug} />
      <div className="form__hp" aria-hidden="true">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="form__row form__row--2">
        <div className="field">
          <label className="field__label" htmlFor="enq-name">
            Name
          </label>
          <input id="enq-name" name="name" required autoComplete="name" />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="enq-email">
            Email
          </label>
          <input
            id="enq-email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="enq-message">
          A note, if you like
        </label>
        <textarea
          id="enq-message"
          name="message"
          placeholder="What draws you to the piece, or anything we should know."
        />
      </div>

      <div>
        <button className="btn" type="submit" disabled={pending}>
          <span>{pending ? "Sending" : "Enquire about this piece"}</span>
          <span className="btn__arrow" aria-hidden="true" />
        </button>
      </div>

      {state.status === "error" && (
        <p className="form__status form__status--error" role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}
