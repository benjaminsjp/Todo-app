import { data } from "@/app/data/test-data"
import TaskDetails from "./TaskDetails"

export default async function Page({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const task = data.tasks.find(t => t.slug === slug)!

    return <TaskDetails task={task} />
}