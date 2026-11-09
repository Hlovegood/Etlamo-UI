import { DiscRevealList } from "@/components/ui/disc-reveal-list";

const img = (id) =>
  `https://images.unsplash.com/${id}?w=600&q=80&auto=format&fit=crop`;

const items = [
  {
    title: "Songs",
    subtitle: "Every track we've pressed",
    href: "#",
    media: {
      kind: "disc",
      images: [img("photo-1470225620780-dba8ba36b745")],
    },
  },
  {
    title: "Team",
    subtitle: "The people behind the sound",
    href: "#",
    media: {
      kind: "disc",
      images: [
        img("photo-1494790108377-be9c29b29330"),
        img("photo-1507003211169-0a1dd7228f2d"),
        img("photo-1500648767791-00dcc994a43e"),
        img("photo-1438761681033-6461ffad8d80"),
        img("photo-1534528741775-53994a69daeb"),
      ],
    },
  },
  {
    title: "Behind the Scenes",
    subtitle: "Studio nights and rough takes",
    href: "#",
    media: {
      kind: "photos",
      images: [
        img("photo-1598488035139-bdbb2231ce04"),
        img("photo-1516280440614-37939bbacd81"),
        img("photo-1508700115892-45ecd05ae2ad"),
      ],
    },
  },
];

export default function DiscRevealDemo() {
  return (
    <main className="flex min-h-dvh w-full flex-col justify-center overflow-x-clip bg-[#f3ede2] py-16 font-sans">
      <DiscRevealList items={items}>
        <p className="mt-10 text-center text-sm tracking-tight text-[#6f6355]">
          by{" "}
          <a
            href="https://aakashmehra.com/ref/discreveallist"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#3d342b] underline-offset-4 hover:underline"
          >
            aakashmehra.com
          </a>
        </p>
      </DiscRevealList>
    </main>
  );
}
