/** One editorial canvas for every project; each surface supplies its own palette. */
export function ProjectBackdrop({ id }: { id: string }) {
  return <svg className="project-backdrop" data-backdrop-project={id} viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <path className="backdrop-grid" d="M0 100H800M0 200H800M0 300H800M0 400H800M100 0V500M200 0V500M300 0V500M400 0V500M500 0V500M600 0V500M700 0V500" />
    <path className="backdrop-spark" d="M755 215V265M730 240H780M737 222L773 258M737 258L773 222" />
  </svg>;
}