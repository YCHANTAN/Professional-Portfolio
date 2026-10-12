import { ResponsiveImage } from './ResponsiveImage';
import { SocialLinks } from './SocialLinks';
import { ExploreLink } from './motion/ExploreLink';

export function Hero() {
  return <section className="hero reference-hero" aria-labelledby="hero-title">
    <div className="hero-copy">
      <div className="hero-meta"><span className="hero-label"><span aria-hidden="true" />Christian A. Osorno / Portfolio</span></div>
      <div className="hero-title-wrap" data-motion="hero-title"><h1 id="hero-title"><span>DESIGNER’S EYE.</span><span>DEVELOPER’S MIND.</span></h1></div>
      <div className="hero-intro">
        <p>I’m Christian — a <strong>Software Engineer, UI/UX Designer &amp; AI Automation Engineer</strong> turning complex ideas into things that feel simple.</p>
        <div className="hero-actions"><ExploreLink /><a className="hero-discover" href="#archive"><span className="discover-circle" aria-hidden="true">▶</span><span className="serif">See what<br />I do<span className="discover-arrow" aria-hidden="true">↗</span></span></a></div>
      </div>
    </div>
    <figure className="hero-portrait"><ResponsiveImage src="/christian-hero-seated.png" alt="Christian A. Osorno seated at a round wooden table with his laptop, chair and full seated pose visible" portrait eager /></figure>
    <div className="hero-socials"><span className="mono">ELSEWHERE /</span><SocialLinks compact includeResume /></div>
  </section>;
}
