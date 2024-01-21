import dynamic from "next/dynamic";

// Dynamic import of the ActivityMap component
export const SkyNftLocationSelectorDyn = dynamic(
  () => import("~~/components/skynft/SkyNftLocationSelector"),
  { ssr: false }, // Prevents server-side rendering
);
