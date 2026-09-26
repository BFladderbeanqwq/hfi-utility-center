// ONE row template, shared by the column header of every room and by every
// event row. Each room section is an independent grid, so the trailing track
// must be a fixed width too — an `auto` track would be sized per row and the
// status column would drift out of alignment again.
export const ROW = "grid items-center gap-3 [grid-template-columns:var(--board-columns)]"

export const COLUMNS = {
  landscape: "6.5rem minmax(0,1fr) 5.5rem",
  portrait: "8.5rem minmax(0,1fr) 7.5rem",
} as const

// Status is a dot, not a pill: a badge on every row of a schedule board is noise.
export const DOT = {
  approved: "bg-success",
  pending: "bg-warning",
} as const
