import { useState } from "react";
import type { Block } from "@/types/domain";
import { rgbToCss } from "@/utils/color";

interface Props {
  block: Block;
  size?: number;
}

export function ItemSprite({ block, size = 16 }: Props) {
  const [errored, setErrored] = useState(false);
  const hasUrl = !!block.imageUrl;

  if (!hasUrl || errored) {
    return (
      <span
        className="item-sprite item-sprite--fallback"
        style={{
          width: size,
          height: size,
          background: rgbToCss(block.rgb),
        }}
        aria-hidden
      />
    );
  }

  if (block.imageFrameHeight !== undefined) {
    return (
      <span
        className="item-sprite item-sprite--cropped"
        style={{
          width: size,
          height: size,
          backgroundImage: `url("${block.imageUrl}")`,
          backgroundSize: `${size}px auto`,
          backgroundPosition: "0 0",
          backgroundRepeat: "no-repeat",
        }}
        role="img"
        aria-label={block.name}
      />
    );
  }

  return (
    <img
      className="item-sprite"
      src={block.imageUrl}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setErrored(true)}
    />
  );
}
