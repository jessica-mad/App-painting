export function Wordmark({ size = 28 }) {
  return (
    <span
      className="wordmark"
      style={{ fontSize: size, lineHeight: 1, display: "inline-flex", alignItems: "baseline" }}
    >
      Musai
    </span>
  );
}
