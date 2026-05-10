export function Phone({ children, dark = false }) {
  return (
    <div className={"phone grain-soft " + (dark ? "phone-dark" : "")}>
      {children}
    </div>
  );
}
