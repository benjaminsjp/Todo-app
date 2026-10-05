/** Toggle one task-list checkbox in TipTap HTML (view mode, without the editor). */
export function toggleTaskListCheckbox(html: string, checkboxIndex: number): string | null {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const docBoxes = Array.from(doc.querySelectorAll('ul[data-type="taskList"] input[type="checkbox"]'))
  const docInput = docBoxes[checkboxIndex] as HTMLInputElement | undefined
  if (!docInput) return null

  const docLi = docInput.closest('li')
  const nextChecked = docLi?.getAttribute('data-checked') !== 'true'
  if (docLi) docLi.setAttribute('data-checked', nextChecked ? 'true' : 'false')
  docInput.checked = nextChecked
  if (nextChecked) docInput.setAttribute('checked', '')
  else docInput.removeAttribute('checked')

  return doc.body.innerHTML
}
