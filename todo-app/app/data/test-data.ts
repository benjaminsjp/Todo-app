import { group } from "console"
import { ListTodo, NotebookPen } from "lucide-react"
import { title } from "process"

export type Task = {
    status: string
    title: string
    description: string
    deadline: string
    createdAt: string
    updatedAt: string
    slug: string
    id: number
    comments?: {
        id: number
        content: string
        createdAt: string
        author: string
        authorProfilePicture: string
    }[]
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
      group: "Todo app",
      comments: [
        {
          id: 1,
          content: "This is a comment",
          createdAt: "05.04.2026",
          author: "John Doe",
          authorProfilePicture: "https://randomuser.me/api/portraits/men/1.jpg"
        },
      ],
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
      group: "Todo app"
    },
  ],
  status: [
    {
      todo: "Todo",
      inProgress: "In Progress",
      done: "Done",
    },
  ],
  taskGroups: [
    {
      title: "Todo app",
      bg: "bg-pink-500",
      border: "border-pink-500",
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
    },
    {
      title: "Bli Synlig",
      bg: "bg-purple-500",
      border: "border-purple-500",
      tasks: [
        {
          id: 3,
          title: "Feriehjemmet Solviken",
          deadline: "10.04.2026",
          status: "In Progress",
          createdAt: "01.04.2026",
          updatedAt: "05.04.2026",
          description:
            "Teste endringer etterspurt fra kunde",
          slug: "feriehjemmet-solviken",
        },
      ],
    },
  ],
}