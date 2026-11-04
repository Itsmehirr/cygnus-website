import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RegistrationForm } from "@/components/RegistrationForm";

export const metadata: Metadata = pageMeta({
  title: "Cygnature — Registration",
  description:
    "Register your interest in a Cygnature bespoke commission from Cygnus. Leave your details and a note; the house writes back to open the conversation.",
  path: "/cygnature/register",
});

export default function RegisterPage() {
  return (
    <section className="section--top">
      <div className="container stack--loose">
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: "Cygnature", href: "/cygnature" },
            { name: "Registration", href: "/cygnature/register" },
          ]}
        />
        <div className="split">
          <div className="stack">
            <p className="label">Cygnature</p>
            <h1 className="display-1">Register your interest.</h1>
            <p className="lede">
              Tell us a little, or nothing at all. The house writes back to
              every registration to open the conversation.
            </p>
          </div>
          <RegistrationForm />
        </div>
      </div>
    </section>
  );
}
