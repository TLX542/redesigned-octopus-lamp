import { Link } from "react-router-dom";
import { useState } from "react";
import emailjs from "@emailjs/browser";
import PageShell from "../components/PageShell";

function ContactPage({ searchProps, cartCount = 0, wishlistCount = 0, onCartClick }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sendState, setSendState] = useState({ status: "idle", detail: "" });

  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_CONTACT_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!serviceId || !templateId || !publicKey) {
      setSendState({
        status: "error",
        detail: "Email service is not configured. Add EmailJS keys to frontend .env file.",
      });
      return;
    }

    setSendState({ status: "sending", detail: "Sending your message..." });
    try {
      await emailjs.send(
        serviceId,
        templateId,
        {
          from_name: name,
          reply_to: email,
          message,
        },
        { publicKey },
      );
      setSendState({ status: "success", detail: "Message sent. We will get back to you soon." });
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setSendState({
        status: "error",
        detail: "Email sending failed. Please try again or use the support address.",
      });
    }
  };

  return (
    <PageShell
      searchProps={searchProps}
      cartCount={cartCount}
      wishlistCount={wishlistCount}
      onCartClick={onCartClick}
    >
      <main className="flex-1 px-6 py-10 sm:px-10 lg:px-14">
        <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="border border-slate-200 bg-white px-8 py-10 shadow-sm sm:px-10">
            <p className="text-[11px] tracking-[0.28em] text-slate-500 uppercase">Contact</p>
            <h1 className="mt-4 text-4xl font-light tracking-tight text-slate-800 sm:text-5xl">
              We are here when you need a human.
            </h1>
            <p className="mt-5 text-sm leading-7 text-slate-600">
              For order questions, product guidance, or feedback about this storefront, use the
              details alongside. Many common questions are answered on the{" "}
              <Link
                to="/help"
                className="text-slate-800 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-500"
              >
                Help
              </Link>{" "}
              page first.
            </p>
          </div>

          <div className="grid gap-6">
            <article className="border border-slate-200 bg-white px-7 py-7 shadow-sm">
              <p className="text-[11px] tracking-[0.24em] text-slate-400 uppercase">Send a message</p>
              <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
                <label className="grid gap-2 text-sm text-slate-700">
                  Name
                  <input
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="border border-slate-300 px-3 py-2 outline-none focus:border-slate-600"
                    placeholder="Your full name"
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-700">
                  Email
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="border border-slate-300 px-3 py-2 outline-none focus:border-slate-600"
                    placeholder="you@example.com"
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-700">
                  Message
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    className="border border-slate-300 px-3 py-2 outline-none focus:border-slate-600"
                    placeholder="How can we help?"
                  />
                </label>
                <button
                  type="submit"
                  disabled={sendState.status === "sending"}
                  className="w-fit border border-slate-800 px-4 py-2 text-sm text-slate-800 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sendState.status === "sending" ? "Sending..." : "Send message"}
                </button>
                {sendState.detail ? (
                  <p
                    className={`text-sm ${
                      sendState.status === "success" ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {sendState.detail}
                  </p>
                ) : null}
              </form>
            </article>
            <article className="border border-slate-200 bg-[#f8faf9] px-7 py-7 shadow-sm">
              <p className="text-[11px] tracking-[0.24em] text-slate-400 uppercase">Email</p>
              <h2 className="mt-3 text-2xl font-light tracking-tight text-slate-800">
                fragranceshopcs308@gmail.com
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Include your order reference if you have one and a short summary. Replace this
                address with your team&apos;s inbox before launch.
              </p>
            </article>
            <article className="border border-slate-200 bg-[#f8faf9] px-7 py-7 shadow-sm">
              <p className="text-[11px] tracking-[0.24em] text-slate-400 uppercase">Hours</p>
              <h2 className="mt-3 text-2xl font-light tracking-tight text-slate-800">
                Monday–Friday, 9:00–17:00
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Local time to your region. Urgent technical issues with hosting or APIs should go to
                whoever operates the deployment.
              </p>
            </article>
            <article className="border border-slate-200 bg-[#f8faf9] px-7 py-7 shadow-sm">
              <p className="text-[11px] tracking-[0.24em] text-slate-400 uppercase">Visit</p>
              <h2 className="mt-3 text-2xl font-light tracking-tight text-slate-800">
                Online only for now
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                This experience is designed as a focused digital boutique. Any future showroom or
                stockist details can live in this card later.
              </p>
            </article>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

export default ContactPage;
