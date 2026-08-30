import LumoraIcon from "./LumoraIcon"

function LumoraWordmark({ iconSize = 40, textSize = "text-2xl", className = "" }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LumoraIcon size={iconSize} />
      <span className={`font-bold tracking-tight ${textSize} text-current`}>
        Lumora <span className="text-[#7C3AED]">AI</span>
      </span>
    </div>
  )
}

export default LumoraWordmark