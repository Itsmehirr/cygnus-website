"use server";

import { getPiece } from "@/content/pieces";
import { houseInbox, sendMail } from "@/lib/mail";

export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function field(formData: FormData, name: string, max = 2000) {
  const v = formData.get(name);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/* ---------- Sanctuary: individual piece → enquiry ---------- */

export async function submitEnquiry(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  // Honeypot: real visitors never fill this.
  if (field(formData, "company")) return { status: "success" };

  const name = field(formData, "name", 120);
  const email = field(formData, "email", 200);
  const phone = field(formData, "phone", 60);
  const location = field(formData, "location", 120);
  const message = field(formData, "message");
  const pieceSlug = field(formData, "piece", 120);
  const appointment = field(formData, "intent", 20) === "appointment";
  const piece = getPiece(pieceSlug);

  if (!name || !EMAIL.test(email)) {
    return {
      status: "error",
      message: "A name and a working email address are needed to reply.",
    };
  }

  const subject = `${appointment ? "Private appointment" : "Enquiry"} — ${piece?.name ?? "Cygnus"}`;
  const toHouse = await sendMail({
    to: houseInbox(),
    subject,
    replyTo: email,
    text: [
      `Piece: ${piece?.name ?? "(unspecified)"} (${piece?.reference ?? pieceSlug ?? "n/a"})`,
      `Request: ${appointment ? "private appointment" : "enquiry"}`,
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "—"}`,
      `Location: ${location || "—"}`,
      "",
      message || "(no message)",
    ].join("\n"),
  });

  if (!toHouse.ok) {
    return {
      status: "error",
      message: "The note did not send. Please try again, or write to us directly.",
    };
  }

  // Acknowledgement to the visitor.
  await sendMail({
    to: email,
    subject: `Cygnus — your ${appointment ? "appointment request" : "enquiry"}${piece ? `: ${piece.name}` : ""}`,
    text: [
      `Thank you, ${name}.`,
      "",
      appointment
        ? `Your request for a private appointment${piece ? ` to see ${piece.name}` : ""} has reached the house. We will write to you with times.`
        : `Your enquiry${piece ? ` about ${piece.name}` : ""} has reached the house. We reply personally and in order.`,
      "",
      "Cygnus",
    ].join("\n"),
  });

  return { status: "success" };
}

/* ---------- Cygnature: registration → email from the house ---------- */

export async function submitRegistration(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (field(formData, "company")) return { status: "success" };

  const name = field(formData, "name", 120);
  const email = field(formData, "email", 200);
  const phone = field(formData, "phone", 60);
  const location = field(formData, "location", 120);
  const interest = field(formData, "interest", 120);
  const message = field(formData, "message");

  if (!name || !EMAIL.test(email)) {
    return {
      status: "error",
      message: "A name and a working email address are needed to write back.",
    };
  }

  const toHouse = await sendMail({
    to: houseInbox(),
    subject: `Cygnature registration — ${name}`,
    replyTo: email,
    text: [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "—"}`,
      `Location: ${location || "—"}`,
      `Interest: ${interest || "—"}`,
      "",
      message || "(no message)",
    ].join("\n"),
  });

  if (!toHouse.ok) {
    return {
      status: "error",
      message: "The registration did not send. Please try again, or write to us directly.",
    };
  }

  // "Email from us." — the step after registration in the sitemap.
  await sendMail({
    to: email,
    subject: "Cygnature — a note from Cygnus",
    text: [
      `Thank you, ${name}.`,
      "",
      "Your registration for Cygnature has reached the house. A member of the atelier will write to you to begin the conversation: what you have in mind, and the geometry that might hold it.",
      "",
      "Until then, nothing is required of you.",
      "",
      "Cygnus",
    ].join("\n"),
  });

  return { status: "success" };
}
