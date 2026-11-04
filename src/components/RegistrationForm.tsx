"use client";

import { useActionState } from "react";
import { submitRegistration, type FormState } from "@/app/actions";

const initial: FormState = { status: "idle" };

export function RegistrationForm() {
  const [state, action, pending] = useActionState(submitRegistration, initial);

  if (state.status === "success") {
    return (
      <div className="form__done stack">
        <p className="display-4" style={{ fontFamily: "var(--font-display)" }}>
          Thank you. A note from the house will follow.
        </p>
        <p className="muted">
          A member of the atelier will write to you to begin the conversation.
          Until then, nothing is required of you.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="form" noValidate>
      <div className="form__hp" aria-hidden="true">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="form__row form__row--2">
        <div className="field">
          <label className="field__label" htmlFor="reg-name">
            Name
          </label>
          <input id="reg-name" name="name" required autoComplete="name" />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="reg-email">
            Email
          </label>
          <input
            id="reg-email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div className="form__row form__row--2">
        <div className="field">
          <label className="field__label" htmlFor="reg-phone">
            Telephone (optional)
          </label>
          <input id="reg-phone" name="phone" type="tel" autoComplete="tel" />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="reg-location">
            City
          </label>
          <input
            id="reg-location"
            name="location"
            autoComplete="address-level2"
          />
        </div>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="reg-interest">
          What you have in mind
        </label>
        <select id="reg-interest" name="interest" defaultValue="">
          <option value="" disabled>
            Choose, or leave open
          </option>
          <option>A ring</option>
          <option>Earrings</option>
          <option>A necklace</option>
          <option>A bracelet</option>
          <option>Something not yet named</option>
        </select>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="reg-message">
          A note, if you like
        </label>
        <textarea
          id="reg-message"
          name="message"
          placeholder="An occasion, a stone you already own, a form you keep returning to."
        />
      </div>

      <div>
        <button className="btn" type="submit" disabled={pending}>
          <span>{pending ? "Sending" : "Register"}</span>
          <span className="btn__arrow" aria-hidden="true" />
        </button>
      </div>

      {state.status === "error" && (
        <p className="form__status form__status--error" role="alert">
          {state.message}
        </p>
      )}

      <p className="form__status">
        We use these details only to write back to you.
      </p>
    </form>
  );
}
