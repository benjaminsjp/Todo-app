import { Metadata } from "next"
import { KanbanBoard } from "@/components/Kanban/KanbanBoard"

export const metadata: Metadata = {
  title: "Tasks | På'n",
  description: "View all your tasks in one place",
}

export default function Page() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="container mx-auto flex-1 flex flex-col px-8 py-12">
        <h1 className="text-5xl font-medium font-heading text-heading-strong mb-8">
          Tasks
        </h1>
        <KanbanBoard />
      </div>
    </div>
  )
}