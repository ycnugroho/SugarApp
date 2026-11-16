import { Apple, Banana, Candy, Coffee, Grape, Milk, Sprout, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

const custom: Record<string, ReactNode> = {
  chocolate: <><path d="M5 3h14v18H5zM5 9h14M5 15h14M12 3v18" /><path d="m7 5 2 2m5-2 2 2" /></>,
  strawberry: <><path d="M5 8c-2 4 2 11 7 13 5-2 9-9 7-13-2-3-12-3-14 0ZM12 7l-5-4 1 5m4-1 5-4-1 5M12 7V2" /><path d="M8 11h.01M15 11h.01M11 14h.01M15 16h.01M9 17h.01" /></>,
  melon: <><path d="M3 7c0 8 4 14 10 14s9-6 9-14H3ZM6 7c0 6 3 11 7 11s6-5 6-11M10 10l1 2m4-2-1 2" /></>,
  vanilla: <><path d="m9 14 3 8 3-8M7 14h10c3-2 2-5-1-5 1-4-5-5-6-2-4-1-6 5-3 7ZM10 17l4 2" /></>,
  durian: <><path d="m12 4 2-3M12 4l3 2 3-1 1 4 3 2-2 3 1 4-4 1-2 3-3-1-3 1-2-3-4-1 1-4-2-3 3-2 1-4 3 1 3-2ZM12 6c-3 4-3 10 0 14M8 9l1 2m7-2-1 2m-8 4 2-1m7 0 1 2" /></>,
  lychee: <><path d="M13 7c-4-2-9 1-9 6a7 7 0 0 0 14 0c0-3-2-5-5-6ZM12 7V3m0 2c3-4 7-3 8-2-1 4-5 5-8 2" /><path d="M8 10h.01M13 11h.01M7 14h.01M11 15h.01M15 15h.01M10 18h.01" /></>,
  taro: <><path d="M9 8c-5 1-6 10-2 13 3 2 10 0 11-4 1-4-3-9-9-9ZM9 11l7 2M7 15l10 2M8 19l6 1M12 8V3c-5-2-7 1-6 3 3 1 5 0 6-3Zm0 2c3-5 7-3 7-2-1 3-4 4-7 2" /></>,
  matcha: <><path d="M3 13h18c-1 6-4 8-9 8s-8-2-9-8ZM7 21h10M13 13l-3-9 5-2 3 11M11 4l3 9m0-10 2 10M4 16h16" /></>,
  blueberry: <><circle cx="8" cy="14" r="6" /><circle cx="17" cy="9" r="5" /><path d="m7 11 1-2 1 2 2 1-2 1-1 2-1-2-2-1 2-1Zm9-4 1-1 1 1 1 1-1 1-1 1-1-1-1-1 1-1M11 5c0-2 2-3 4-3" /></>,
  mango: <><path d="M15 6c6 3 5 11 0 14-5 3-12 0-11-5 1-4 6-3 6-6 0-2 2-4 5-3ZM14 6V2m0 2c2-3 6-1 7 1-3 2-5 2-7-1" /></>,
  caramel: <><path d="m7 6-3 12c2 4 14 4 16 0L17 6M7 6c2-2 8-2 10 0-1 2-9 2-10 0ZM6 9c2 3 3-1 5 0 1 1 0 4 2 4s1-3 3-3l2 1M3 21h18" /></>,
  cappuccino: <><path d="M4 10h13v5a6 6 0 0 1-12 0l-1-5ZM17 11h2a3 3 0 0 1 0 6h-3M2 22h18M5 10C2 7 5 4 8 5c1-3 5-3 6 0 4-1 5 4 2 5" /><path d="M8 7c1-2 4-1 4 0s-2 2-2 2-2-1-2-2Z" /></>,
  butterscotch: <><path d="m4 9 10-4 6 3-10 4-6-3Zm0 0v9l6 3 10-4V8M10 12v9M8 8l6 3M16 7v3" /></>,
  milo: <><path d="M4 10h12l-2 11H6L4 10ZM16 11h3a3 3 0 0 1 0 6h-4M5 14h10M10 10V2m0 3L7 3m3 4 3-2m-3 4L7 7M18 3v5m-2-3 2 1 2-2" /></>,
  chocolatos: <><path d="m4 5 4-2 6 17-4 2L4 5Zm10-2 4-1 4 17-4 1-4-17ZM5 8l5-1m-4 6 5-1m-3 6 4-1M15 7l5-1m-4 6 5-1m-4 6 4-1" /></>,
  kopi: <><ellipse cx="8" cy="9" rx="5" ry="7" transform="rotate(28 8 9)" /><ellipse cx="17" cy="16" rx="4" ry="6" transform="rotate(28 17 16)" /><path d="M10 3C5 7 11 9 6 15M19 11c-5 3 1 5-4 10" /></>,
};
const flavors: [RegExp, string, string, LucideIcon?][] = [
  [/chocolatos/i,"chocolatos","chocolate"], [/cokelat/i,"chocolate","chocolate"], [/stroberi/i,"strawberry","strawberry"], [/moka/i,"moka","coffee",Coffee], [/melon/i,"melon","melon"], [/anggur/i,"grape","grape",Grape], [/vanila/i,"vanilla","vanilla"], [/durian/i,"durian","golden"], [/leci/i,"lychee","coral"], [/taro/i,"taro","taro"], [/matcha/i,"matcha","matcha"], [/bluberry/i,"blueberry","berry"], [/mangga/i,"mango","mango"], [/banana/i,"banana","banana",Banana], [/bubble gum/i,"candy","pastel",Candy], [/apel/i,"apple","apple",Apple], [/karamel/i,"caramel","caramel"], [/cappucino/i,"cappuccino","latte"], [/butterscotch/i,"butterscotch","butterscotch"], [/green tea/i,"tea","tea",Sprout], [/milo/i,"milo","emerald"], [/kopi/i,"kopi","espresso"],
];
export function FlavorIcon({ name }: { name: string }) {
  const [, key, tone, Icon] = flavors.find(([r]) => r.test(name)) ?? [/.*/, "milk", "dairy", Milk];
  return <span className={`flavor-${tone} flavor-icon flex h-10 w-10 items-center justify-center rounded-xl`}>{Icon ? <Icon className="!h-5 !w-5" strokeWidth={1.75} /> : <svg aria-hidden="true" className="!h-5 !w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{custom[key]}</svg>}</span>;
}
