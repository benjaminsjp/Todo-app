"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import StatusSelect from "@/components/status-select/StatusSelect"
import { type Task } from "@/app/data/test-data"

export default function TaskDetails({ task }: { task: Task }) {
    const [status, setStatus] = useState(task.status)

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main container mx-auto flex-1 flex flex-row px-8">
                <div className="flex flex-1 flex-col gap-4 max-w-prose py-12">
                    <div className="flex gap-3 items-center">
                        <Button variant={"secondary"}>Edit task</Button>
                        <span className="text-sm font-medium text-muted-foreground">
                            Last edited: {task.updatedAt}
                        </span>
                    </div>
                    <h1 className="text-5xl font-bold text-center sm:text-left font-heading text-heading-strong mb-6">
                        {task.title}
                    </h1>
                    <p>{task.description}</p>
                </div>
                <div className="flex flex-col gap-4 ml-auto min-w-lg border-l px-8 py-12">
                    <div className="flex items-center">
                        <span className="w-1/2">Status: </span>
                        <StatusSelect className="text-base" value={status} onChange={setStatus} />
                    </div>
                    <div className="flex items-center">
                        <span className="w-1/2">Created at: </span>
                        <p> {task.createdAt}</p>
                    </div>
                    <div className="flex items-center">
                        <span className="w-1/2">Deadline: </span>
                        <p> {task.deadline}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}