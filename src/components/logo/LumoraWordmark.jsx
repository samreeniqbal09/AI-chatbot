/**
 * LumoraWordmark
 * Renders the "LUMORA AI / CHATBOT" stylized text mark (transparent background).
 * Expects the image at public/Lumora-wordmark.png
 *
 * Use this only where you want the stylized logo font (landing hero, auth header).
 * For sidebar/chat-header labels that should stay normal readable UI text,
 * use <LumoraIcon /> plus plain text instead.
 *
 * Usage:
 *   <LumoraWordmark height={40} />
 */
export default function LumoraWordmark({ height = 40, className = "", ...props }) {
  return (
    <img
      src="/Lumora-wordmark.png"
      alt="Lumora AI — Chatbot"
      height={height}
      className={className}
      style={{ objectFit: "contain", width: "auto" }}
      {...props}
    />
  );
}