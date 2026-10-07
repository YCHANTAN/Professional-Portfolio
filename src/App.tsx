import { useState } from 'react';
import { motion } from 'motion/react';
import { useActiveSection } from './components/useActiveSection';
import { useMotionPreference } from './components/motion/useMotionPreference';
import { experience, featuredProjects, profile, type Project } from './data/portfolio';
import { SectionHeading } from './components/SectionHeading';
import { ResponsiveImage } from './components/ResponsiveImage';
import { ProjectSpread } from './components/ProjectSpread';
import { ProjectArchive } from './components/ProjectArchive';
import { SocialLinks } from './components/SocialLinks';
import { DownloadResume } from './components/DownloadResume';
import { SkillsToolkit } from './components/SkillsToolkit';
import { ProjectDialog } from './components/ProjectDialog';
import { ContactForm } from './components/ContactForm';
import { ThemeToggle } from './components/ThemeToggle';
import { ContentTransition } from './components/motion/ContentTransition';
import { BlurIntro } from './components/motion/BlurIntro';
import { CuriosityCode } from './components/motion/CuriosityCode';
import { ExploreLink } from './components/motion/ExploreLink';
import { DisciplineMarquee } from './components/motion/DisciplineMarquee';
import { OpeningDepth, ProjectStack } from './components/motion/SectionDepth';

export default function App() {
  const activeSection = useActiveSection();
  const reducedMotion = useMotionPreference();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header"><a href="#home" className="wordmark" aria-label="Christian Osorno home">christian<span>®</span></a><span className="header-location mono">Cebu, PH <span aria-hidden="true">↗</span> Available for an internship</span><div className="header-actions"><nav id="main-nav" className={menuOpen ? 'is-open' : ''} aria-label="Main navigation" onKeyDown={e => { if (e.key === 'Escape') { setMenuOpen(false); document.querySelector<HTMLButtonElement>('.menu-toggle')?.focus(); } }}>{[['Work', '#work'], ['About', '#about'], ['Archive', '#archive'], ['Let’s talk ↗', '#contact']].map(([name, href]) => <a key={href} href={href} aria-current={activeSection === href ? 'location' : undefined} onClick={() => setMenuOpen(false)}>{name}{activeSection === href && <motion.span className="nav-active-line" layoutId="nav-active-line" transition={{ duration: reducedMotion ? 0 : .25, ease: [.22, 1, .36, 1] }} aria-hidden="true" />}</a>)}</nav><ThemeToggle /><button className="menu-toggle" aria-expanded={menuOpen} aria-controls="main-nav" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? 'Close ×' : 'Menu +'}</button></div></header>
    <main id="main">
      <OpeningDepth>
      <section className="hero" aria-labelledby="hero-title"><div className="hero-meta mono"><span>Christian A. Osorno / Portfolio</span><span>Built with curiosity. Made in Cebu.</span></div><div className="hero-title-wrap" data-motion="hero-title"><h1 id="hero-title"><span>DESIGNER’S EYE.</span><span>DEVELOPER’S MIND.</span></h1><span className="hero-spark" aria-hidden="true">✳</span></div><div className="hero-bottom"><div className="hero-intro"><BlurIntro className="serif" lines={['A little instinct.', 'A lot of intention.']} /><p>I’m Christian — a <strong>Software Engineer, UI/UX Designer & AI Automation Engineer</strong> turning complex ideas into things that feel simple.</p><div className="hero-actions"><ExploreLink /></div><div className="hero-socials"><span className="mono">ELSEWHERE /</span><SocialLinks compact includeResume /></div></div><div className="hero-collage" data-motion="hero-collage"><div className="collage-code mono" aria-hidden="true"><span>const perspective = {'{'}</span><span>  design: 'human',</span><span>  code: 'considered',</span><CuriosityCode /><span>{'}'};</span></div><span className="collage-sticker">MADE TO<br /><em>make sense.</em></span><span className="collage-note serif">hello, world.</span></div><a className="internship-note" href="#contact"><span className="availability-dot" />Open for a<br /><strong>240-hour internship</strong><span aria-hidden="true">↗</span></a></div><figure className="hero-portrait"><ResponsiveImage src="/christian-hero-collage.png" alt="Christian A. Osorno smiling while working on a MacBook" portrait eager /></figure></section>
      </OpeningDepth>
      <div className="selected-work-foreground">
      <DisciplineMarquee />
      <section id="work" className="work-section" aria-label="Selected work"><SectionHeading label="01 / Selected work" title="IDEAS, OUT IN THE WORLD."><p>A few things I’ve designed, built, and explored.<br />Different disciplines. The same curiosity.</p><a className="text-link" href="#archive">See the full archive ↗</a></SectionHeading><ProjectStack>{featuredProjects.map((project, index) => <ProjectSpread key={project.id} project={project} index={index} onOpen={setActiveProject} />)}</ProjectStack></section>
      </div>
      <section id="about" className="about-section">
        <ContentTransition reveal><SectionHeading label="02 / The person behind the pixels" title="TWO SIDES. ONE PERSPECTIVE." /></ContentTransition>
        <div className="about-layout">
          <ContentTransition reveal><div className="about-art" aria-hidden="true" data-motion="about-art"><span className="about-c">c.</span><span className="about-orbit">DESIGN × CODE × CURIOSITY</span><span className="about-star">✳</span><span className="about-art-note serif">always a work<br />in progress.</span></div></ContentTransition>
          <ContentTransition reveal delay={.08} className="about-copy"><p className="serif about-lead">Good design makes it feel right.<br />Good engineering makes it work.</p><p>I’m a dedicated designer and developer based in Cebu, Philippines. I combine scalable engineering with intuitive, user-centered experiences — because how something works and how it feels should never be separate conversations.</p><p>As a 4th-year Computer Science student at the University of Cebu Main Campus, I’m also drawn to the intersection of technology and environmental research. From a storefront to an ocean-focused research project, I like asking what else is possible.</p><a className="text-link" href="#contact">Looking for a curious intern? Let’s talk ↗</a><DownloadResume subtle /></ContentTransition>
        </div>
        <ContentTransition reveal className="experience-heading"><h3>The path so far</h3><span className="mono">Learning by doing / 2023 — present</span></ContentTransition>
        <div className="experience-list">{experience.map((item, index) => <ContentTransition reveal delay={index * .06} key={item.place}><article><span className="mono experience-date">{item.date}</span><div><h4>{item.role}</h4><p>{item.place}</p></div><p className="experience-detail">{item.detail}</p></article></ContentTransition>)}</div>
      </section>
      <ContentTransition reveal className="skills-entrance"><SkillsToolkit /></ContentTransition>
      <section className="archive-section" id="archive"><ContentTransition reveal><SectionHeading label="04 / The whole collection" title="THE EXPLORATION CONTINUES."><p>Web apps, design studies, and computational research.<br />Take your pick.</p></SectionHeading></ContentTransition><ProjectArchive onOpen={setActiveProject} /></section>
      <section id="contact" className="contact-section"><div className="contact-top mono"><span>05 / The next chapter</span><span><span className="availability-dot" />Seeking a 240-hour internship</span></div><ContentTransition reveal><h2 data-motion="contact-title">LET’S MAKE<br /><span>SOMETHING</span> <em>good.</em><span className="contact-star" aria-hidden="true">✳</span></h2></ContentTransition><div className="contact-layout"><ContentTransition reveal className="contact-info">
          <div className="contact-introduction"><p className="serif contact-lead"><span>Your next project.</span><span>My next chapter.</span></p>
          <p className="contact-summary">I’m looking for a team where I can contribute, learn, and turn good ideas into thoughtful experiences. Have a 240-hour internship in mind?</p></div>
          <div className="contact-details">
            <span className="mono contact-details-label">Direct line /</span>
            <a className="contact-email" href={`mailto:${profile.email}`}>{profile.email} ↗</a>
            <a href={`tel:${profile.phone}`}>{profile.phone}</a>
            <span className="mono contact-location">Cebu, Philippines / Open to conversations</span>
          </div>
        </ContentTransition><ContentTransition reveal delay={.08}><ContactForm /></ContentTransition></div><footer className="site-footer"><a className="wordmark" href="#home">christian<span>®</span></a><SocialLinks /><a href="#home" className="back-top">Back to top ↑</a><div className="footer-bottom mono"><span>© {new Date().getFullYear()} Christian A. Osorno</span><span>Designed with intention. Built with React.</span></div></footer></section>
    </main>
    <ProjectDialog project={activeProject} onClose={() => setActiveProject(null)} />
  </>;
}
