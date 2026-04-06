/**
 * Preview domain slug for frontend nodes: append "-fe"; backend projects — base only.
 */
export function deriveNodeDomainSlug({
  shortCode,
  branchName,
  port,
  projectTag,
}) {
  const sc = String(shortCode ?? "")
    .trim()
    .toLowerCase();
  if (!sc) return null;

  const match = branchName != null ? String(branchName).match(/\d+/) : null;
  const hasBranchDigits = match && match[0] != null && match[0] !== "";
  const numericPart = hasBranchDigits
    ? match[0]
    : port != null && Number.isFinite(Number(port))
      ? String(Number(port))
      : null;
  if (!numericPart) return null;

  const base = `${sc}-${numericPart}`;
  const tag = String(projectTag ?? "").toLowerCase();
  return tag === "frontend" ? `${base}-fe` : base;
}
