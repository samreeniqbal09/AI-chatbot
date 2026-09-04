/**
 * LumoraIcon
 * Renders the Lumora AI triangle mark (transparent background) at any size.
 * Expects the image at public/Lumora-icon.png
 *
 * Usage:
 *   <LumoraIcon size={40} />
 *   <LumoraIcon size={64} className="rounded-xl" />
 */
export default function LumoraIcon({ size = 40, className = "", ...props }) {
  return (
    <img
      src="/Lumora-icon.png"
      alt="Lumora AI"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain" }}
      {...props}
    />
  );
}