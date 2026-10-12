/** Decorative artwork stays behind the project media and outside the accessibility tree. */
export function ProjectBackdrop({ id }: { id: string }) {
  return <svg className="project-backdrop" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <path className="backdrop-grid" d="M0 100H800M0 200H800M0 300H800M0 400H800M100 0V500M200 0V500M300 0V500M400 0V500M500 0V500M600 0V500M700 0V500" />
    {id === 'elven' && <>
      <path d="M55 500Q155 300 60 120M750 500Q640 300 755 50M80 365Q5 330 20 265Q95 280 80 365ZM100 275Q190 240 180 175Q100 190 100 275ZM720 280Q625 250 640 180Q720 205 720 280Z" />
      {[ [80,100], [735,70], [700,390] ].map(([x,y]) => <g key={x} transform={`translate(${x} ${y})`}><path d="M0-16C-65-100-85 0-20 0C-100 65 0 85 0 20C65 100 85 0 20 0C100-65 0-85 0-16Z" /><circle r="12" /></g>)}
    </>}
    {id === 'laundry' && <>
      {[ [60,65,45], [730,90,68], [90,400,75], [745,365,35], [165,35,16], [640,460,20] ].map(([x,y,r]) => <g key={x}><circle cx={x} cy={y} r={r} /><path d={`M${x-r*.55} ${y}a${r*.55} ${r*.55} 0 0 1 ${r*.55} ${-r*.55}`} /></g>)}
      <path d="M0 470Q100 410 200 470T400 470T600 470T800 470" />
    </>}
    {(id === 'registration' || id === 'educaite') && <>
      <g transform="translate(30 40) rotate(-12)"><path d="M0 0Q45-15 90 0Q135-15 180 0V100Q135 85 90 100Q45 85 0 100ZM90 0V100M15 25H65M115 25H165M15 45H65M115 45H165" /></g>
      <path d="M650 380L720 345L790 380L720 415ZM675 395V425Q720 455 765 425V395M790 380V445" />
      {id === 'educaite' ? <><path d="M675 60L710 25L745 60L710 95ZM70 340L100 310L130 340L100 370Z" /><circle cx="710" cy="60" r="65" strokeDasharray="4 10" /></> : <><path d="M650 45H765V135H650ZM675 70H740M675 90H720M55 365L70 380L100 345" /><circle cx="77" cy="365" r="45" /></>}
    </>}
    {id === 'pasabuy' && <>
      <path strokeDasharray="10 12" d="M-20 420C200 480 120 50 300 90S620 450 820 30" />
      <path d="M60 90C60 35 140 35 140 90Q140 115 100 155Q60 115 60 90ZM665 365L710 340L755 365V420L710 445L665 420ZM665 365L710 390L755 365M710 390V445" /><circle cx="100" cy="85" r="13" />
      <path d="M650 65H760M735 40L760 65L735 90" />
    </>}
    {id === 'marine' && <>
      <path d="M0 75Q100 10 200 75T400 75T600 75T800 75M0 445Q100 380 200 445T400 445T600 445T800 445M45 350Q85 300 125 350Q85 400 45 350ZM125 350L150 325V375Z" />
      <circle cx="740" cy="145" r="24" /><circle cx="710" cy="85" r="12" />
    </>}
    {id === 'antifungal' && <>
      <path d="M30 70L95 30L160 70V145L95 185L30 145ZM650 335L715 295L780 335V410L715 450L650 410ZM160 70L210 40M650 335L605 310" />
      {[ [30,70], [95,30], [160,145], [650,335], [715,450], [780,335] ].map(([x,y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="13" />)}
    </>}
    <path className="backdrop-spark" d="M755 215V265M730 240H780M737 222L773 258M737 258L773 222" />
  </svg>;
}
