/**
 * LumoraIcon
 * Renders the Lumora AI triangle mark at any size.
 * Expects the image at public/Lumora-logo.png
 *
 * NOTE: If you create a dedicated transparent-background,
 * icon-only crop (just the triangle, no wordmark), save it to
 * public/Lumora-icon.png and change the src below back to that.
 *
 * Usage:
 *   <LumoraIcon size={40} />
 *   <LumoraIcon size={64} className="rounded-xl" />
 */
export default function LumoraIcon({ size = 40, className = "", ...props }) {
  return (
    <img
      src="/Lumora-logo.png"
      alt="Lumora AI"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain" }}
      {...props}
    />
  );
}
