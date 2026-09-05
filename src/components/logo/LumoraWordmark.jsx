/**
 * LumoraWordmark
 * Uses the main Lumora logo from the public folder.
 *
 * Main logo:
 *   public/Lumora-logo.png
 *
 * Favicon:
 *   public/Lumora-favicon.svg
 *
 * Usage:
 *   <LumoraWordmark height={40} />
 */

export default function LumoraWordmark({
  height = 40,
  className = "",
  ...props
}) {
  return (
    <img
      src="/Lumora-logo.png"
      alt="Lumora AI — Chatbot"
      height={height}
      className={className}
      style={{
        objectFit: "contain",
        width: "auto",
        height: `${height}px`,
      }}
      {...props}
    />
  )
}