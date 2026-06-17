import Image from 'next/image'

export function LandingAppShowcase() {
  return (
    <figure className="overflow-hidden rounded-2xl border border-border/80 bg-card transition-transform duration-500 hover:scale-[1.01] motion-reduce:hover:scale-100">
      <Image
        src="/app-showcase-light.jpg"
        alt="På'n personal task board with sidebar groups and a Kanban view in light mode"
        width={1440}
        height={900}
        priority
        unoptimized
        className="block w-full h-auto dark:hidden"
      />
      <Image
        src="/app-showcase-dark.jpg"
        alt="På'n personal task board with sidebar groups and a Kanban view in dark mode"
        width={1440}
        height={900}
        priority
        unoptimized
        className="hidden w-full h-auto dark:block"
      />
    </figure>
  )
}
