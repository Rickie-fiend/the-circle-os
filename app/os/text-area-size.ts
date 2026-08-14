export function sizeTextAreaToContent(editor: HTMLTextAreaElement | null) {
  if (!editor) return;

  const previousMinHeight = editor.style.minHeight;
  editor.style.minHeight = "0px";
  editor.style.height = "0px";

  const lineHeight = Number.parseFloat(window.getComputedStyle(editor).lineHeight);
  const scrollHeight = editor.scrollHeight;
  const renderedLines = lineHeight
    ? Math.max(1, Math.round(scrollHeight / lineHeight))
    : 1;

  editor.style.height = lineHeight
    ? `${renderedLines * lineHeight}px`
    : `${scrollHeight}px`;
  editor.style.minHeight = previousMinHeight;
}
