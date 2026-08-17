export function sizeTextAreaToContent(editor: HTMLTextAreaElement | null) {
  if (!editor) return;

  // An empty editor measures one line, because scrollHeight ignores the
  // placeholder. Setting that as an explicit height overrode the reserve and
  // clipped every placeholder that wrapped, which is why a caption showed only
  // its first line. With no value, let the stylesheet own the height.
  if (!editor.value) {
    editor.style.removeProperty("height");
    return;
  }

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
