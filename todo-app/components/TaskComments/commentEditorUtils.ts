/** True when TipTap HTML has no meaningful text. */
export function hasCommentEditorContent(html: string): boolean {
  if (!html.trim()) return false
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return (doc.body.textContent ?? '').replace(/\u00a0/g, ' ').trim().length > 0
}
