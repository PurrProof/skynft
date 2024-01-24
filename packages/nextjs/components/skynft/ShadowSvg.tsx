import React, { useEffect, useRef } from "react";

interface ShadowSvgProps {
  svgContent: string;
  width: string;
  height: string;
}

const ShadowSvg = ({ svgContent, width, height }: ShadowSvgProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      if (!containerRef.current.shadowRoot) {
        const shadowRoot = containerRef.current.attachShadow({ mode: "open" });
        shadowRoot.innerHTML = `
          <style>
            :host {
              display: block;
              width: ${width};
              height: ${height};
              overflow: hidden;
              cursor: pointer;
            }
            svg {
              width: 100%;
              height: 100%;
            }
          </style>
          ${svgContent}`;
      } else {
        containerRef.current.shadowRoot.innerHTML = `
          <style>
            :host {
              display: block;
              width: ${width};
              height: ${height};
              overflow: hidden;
              cursor: pointer;
            }
            svg {
              width: 100%;
              height: 100%;
            }
          </style>
          ${svgContent}`;
      }
    }
  }, [svgContent, width, height]);

  return <div ref={containerRef} style={{ width, height }} />;
};

export default ShadowSvg;
