import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";


export const metadata: Metadata = {
  title: "Home | TODO App",
  description: "A simple TODO app built with Next.js 13 and styled with Tailwind CSS. Features include adding, editing, and deleting tasks, as well as a dark mode toggle for a better user experience.",
};

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main container mx-auto flex flex-1 flex-col p-8">
        <h1 className="text-6xl font-bold text-center sm:text-left font-heading text-heading-strong mb-8">
          TODO App with Next.js 13 and Tailwind CSS
        </h1>
      </div>
    </div>
  );
}
