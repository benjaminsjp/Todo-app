import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskCard } from './TaskCard'
import { type Task } from '@/app/data/test-data'

type TaskWithGroup = Task & { group?: string }

interface Props {
  task: TaskWithGroup
  taskGroup?: { title: string; bg: string; border: string }
}

export function SortableTaskCard({ task, taskGroup }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isDragging ? 'opacity-40' : ''}
    >
      <TaskCard task={task} taskGroup={taskGroup} />
    </div>
  )
}