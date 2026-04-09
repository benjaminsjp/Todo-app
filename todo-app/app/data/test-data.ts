import { ListTodo, NotebookPen } from "lucide-react"

export type Task = {
    status: string
    title: string
    description: string
    deadline: string
    createdAt: string
    updatedAt: string
    slug: string
    id: number
}


// This is sample data
export const data = {
  navMain: [
    {
      title: "Tasks",
      url: "/tasks",
      icon: ListTodo,
      isActive: true,
    },
    {
      title: "Notes",
      url: "#",
      icon: NotebookPen,
      isActive: false,
    },
  ],
  tasks: [
    {
      id: 1,
      title: "Todo app design",
      deadline: "10.04.2026",
      status: "In Progress",
      createdAt: "01.04.2026",
      updatedAt: "05.04.2026",
      description:
        "Design a new todo app with a clean and modern interface. The app should allow users to create, edit, and delete tasks, as well as organize them into different categories. The design should be responsive and work well on both desktop and mobile devices.",
      slug: "todo-app-design",
    },
    {
      id: 2,
      title: "Todo app functionality",
      deadline: "20.04.2026",
      status: "Todo",
      createdAt: "02.04.2026",
      updatedAt: "02.04.2026",
      description:
        "Implement the core functionality of the todo app, including task creation, editing, and deletion.",
      slug: "todo-app-functionality",
    },
  ],
  status: [
    {
      todo: "Todo",
      inProgress: "In Progress",
      done: "Done",
    },
  ],
}