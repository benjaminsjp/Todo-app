import { data } from "@/app/data/test-data"
import TaskDetails from "./TaskDetails"
import { type StatusOption } from "@/components/status-select/StatusSelect"
import { Metadata } from "next"

import { auth } from '@/lib/auth/server'
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: "Task Details | På'n",
    description: "View details for a specific task",
}

export default async function Page({
    params,
}: {
    params: Promise<{ slug: string }>
}) {

    const { data: session } = await auth.getSession()
    const user = session?.user
    
    const { slug } = await params
    const task = data.tasks.find(t => t.slug === slug)!
    const taskGroup = data.taskGroups.find(g => g.title === task.group)?.title
    
    const taskGroupOptions: StatusOption[] = data.taskGroups.map((g, i) => ({
        value: g.title,
        label: g.title,
        color: g.bg,
    }))


    return <TaskDetails task={task} taskGroup={taskGroup} taskGroupOptions={taskGroupOptions} />
}