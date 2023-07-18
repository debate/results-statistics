import Link from "next/link";
import React from "react";
import { BiLinkExternal } from "react-icons/bi";

const links: { href: string; name: string }[] = [
  {
    name: "Search",
    href: "/tools/compass",
  },
  {
    name: "Rankings",
    href: "/tools/compass",
  },
  {
    name: "Round Predictions",
    href: "/tools/x-ray",
  },
  {
    name: "Strike Sheets",
    href: "/tools/radar",
  },
  {
    name: "Threat Sheets",
    href: "/tools/radar",
  },
];

const QuickLinkGrid = () => {
  return (
    <div className="flex flex-wrap w-full justify-start my-4 -ml-1">
      {links.map(({ name, href }, idx) => (
        <Link
          href={href}
          key={`quick-link-${idx}`}
          className="bg-indigo-400 m-1 transition-all text-white px-1.5 py-0.5 rounded-full text-sm flex items-center space-x-1 group hover:shadow-halo hover:bg-gradient-to-r from-sky-400 via-purple-500 to-red-400"
        >
          <p className="transition-all">{name}</p>
          <BiLinkExternal className="group-hover:-translate-y-0.5 group-active:scale-75 transition-all" />
        </Link>
      ))}
    </div>
  );
};

export default QuickLinkGrid;
