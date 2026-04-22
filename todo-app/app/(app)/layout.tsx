import type { Metadata } from "next";
import { AppSidebarServer } from "@/components/sidebar/AppSidebarServer";
import AppMenubar from "@/components/menubar";
import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "TODO App",
  description: "A simple TODO app built with Next.js 13 and styled with Tailwind CSS. Features include adding, editing, and deleting tasks, as well as a dark mode toggle for a better user experience.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {

  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')

  return (
    <>
      <AppSidebarServer />
      <main className="flex flex-1 flex-col">
        <AppMenubar />
        {children}
      </main>
    </>
  )
}

