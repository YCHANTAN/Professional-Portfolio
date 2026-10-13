export const profile = {
  name: 'Christian A. Osorno', email: 'christianosorno20@gmail.com', phone: '+639271410824',
  location: 'Cebu, Philippines', github: 'https://github.com/YCHANTAN',
  socials: [
    { name: 'GitHub', url: 'https://github.com/YCHANTAN' },
    { name: 'LinkedIn', url: 'https://linkedin.com/in/christian-osorno-2742a4379/' },
    { name: 'Instagram', url: 'https://www.instagram.com/betlowg__/' },
    { name: 'Facebook', url: 'https://www.facebook.com/localz123' },
  ],
};

export const categories = ['All work', 'Development', 'UI/UX', 'AI & research'] as const;
export type Category = typeof categories[number];
export interface Project {
  id: string; title: string; category: Exclude<Category, 'All work'>; discipline: string;
  summary: string; description: string; details: string[]; stack: string[];
  image: string; imageAlt: string; imageKind: 'mockup' | 'illustration' | 'screenshot'; tone: 'pink' | 'orange' | 'blue' | 'green' | 'yellow';
  collaborative?: boolean; team?: string[]; contribution?: string; role?: string; note?: string;
  liveUrl?: string; repositoryUrl?: string; implementationUrl?: string;
  featured?: boolean; headline?: string;
}
export const projects: Project[] = [
  {
    id: 'floodsense', title: 'FloodSense', category: 'Development', discipline: 'Full-Stack Web App / Geospatial & Disaster Tech / Civic AI',
    summary: 'Hyper-local flood risk forecasting, crowdsourced hazard reports, and an AI safety assistant for Metro Cebu.',
    description: 'FloodSense is an urban disaster safety platform for Metro Cebu, Philippines, calibrated for coastal urban flooding. It combines meteorological forecasts, astronomical tidal cycles, topographic elevation, historical disaster models from PAGASA and Project NOAH, and verified community reports in an interactive geospatial dashboard and a domain-bounded AI safety assistant.',
    role: 'Full-Stack Developer & System Architect',
    details: [
      'Multi-factor risk engine calculating a 0–100 index across 15 neighborhood zones: rainfall (40%), tidal proximity (25%), elevation (15%), historical susceptibility (20%), and a verified-report bonus of up to 10 points.',
      'Open-Meteo hourly rainfall mapped to PAGASA warning thresholds, with a semi-diurnal tide model and Project NOAH hazard susceptibility indices.',
      'Interactive mapping with Mapbox/MapLibre vector tiles, custom polygon zones, and real-time report pins.',
      'Crowdsourced reports with coordinates, water depth, and descriptions; still-flooded and cleared votes support community verification, while temporal decay reduces stale reports.',
      'RAG-powered Google Gemini safety assistant with live zone, weather, tide, and report context, disaster-topic guardrails, and a deterministic offline fallback.',
      'Analytics dashboard for historical trends and zone-by-zone risk distributions.',
      'Compound unique indexes prevent duplicate voting; bounding-box pre-filtering reduces point-in-polygon checks before ray casting.',
      'TypeScript and Drizzle ORM support typed application data, with Zod validation, JWT authentication, and sliding-window rate limiting.',
    ],
    stack: ['React 18', 'TypeScript 5', 'Vite 5', 'Redux Toolkit', 'React-Redux', 'React Router DOM 6', 'Mapbox GL JS', 'MapLibre GL', 'React Map GL', 'Recharts', 'Tailwind CSS v4', 'Radix UI', 'Lucide React', 'Framer Motion', 'Next.js 14', 'Node.js', 'Zod', 'PostgreSQL', 'Drizzle ORM', 'Drizzle-Kit', 'JWT', 'BcryptJS', 'Sliding-window rate limiting', 'Google Gemini 1.5 Flash', 'RAG', 'Open-Meteo API', 'PAGASA rainfall standards', 'Project NOAH data models'],
    image: '/projects/floodsense-device-cutout.png', imageAlt: 'FloodSense disaster safety landing page displayed on a laptop, tablet and phone', imageKind: 'mockup', tone: 'blue', featured: true,
  },
  {
    id: 'gourmate', title: 'GourMate', category: 'Development', discipline: 'AI Voice Assistant / Web Application',
    summary: 'An AI cooking companion for discovering meals, planning recipes, and cooking step by step through voice and text.',
    description: 'GourMate features Kef, an animated 3D chef that provides conversational cooking assistance. Users can suggest ingredients, request suitable dishes, customize recipes, ask cooking questions, and manage timers. Spoken responses, a chat interface, and a recipe panel support hands-free cooking.',
    collaborative: true, team: ['Erica Gin Echavez', 'Christian Osorno', 'Christian Kyle Ducay'],
    details: ['Meal suggestions based on available ingredients and preferences.', 'Recipe generation, planning, and revisions.', 'Guided cooking with step navigation and ingredient checklists.', 'Ingredient substitutions and cooking assistance.', 'Multilingual speech recognition and spoken responses.', 'Animated 3D chef with responsive character states.', 'Cooking timers, saved recipes, and session persistence.', 'Responsive claymorphism interface with light and dark themes.'],
    stack: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Zustand', 'Three.js', 'React Three Fiber', 'React Three Drei', 'React Spring', 'Framer Motion', 'Python', 'FastAPI', 'Pydantic', 'Uvicorn', 'Google Gemini API', 'Whisper small multilingual', 'faster-whisper', 'CTranslate2', 'Silero VAD', 'ONNX Runtime', 'edge-tts', 'REST APIs', 'WebSockets', 'localStorage', 'Vitest', 'React Testing Library', 'pytest', 'Vercel', 'Railway deployment configuration', 'Git', 'GitHub', 'GitHub Actions'],
    image: '/projects/gourmate-device-cutout.png', imageAlt: 'GourMate cooking conversation, recipe steps and Kef displayed on a laptop, tablet and phone', imageKind: 'mockup', tone: 'green',
    liveUrl: 'https://gour-mate.vercel.app/', repositoryUrl: 'https://github.com/Zycheee/GourMate',
  },
  {
    id: 'lifevent', title: 'Lifevent', category: 'Development', discipline: 'AI / Event Intelligence Dashboard',
    summary: 'Helping Lifewood discover technology exhibitions, assess business fit, and review event submissions.',
    description: 'Lifevent combines event management with AI-assisted discovery. Users can manually scrape exhibition websites or configure scheduled discovery. The scraper uses Apify for search and Google Gemini to extract event information and assess relevance. Qualifying automatic results enter a review queue for administrator approval.',
    collaborative: true,
    contribution: 'Contributed to the dashboard interface and scraper integration, including the automatic qualification pipeline, review-queue improvements, duplicate handling, dashboard error fixes, and deployment documentation.',
    note: 'Some website features require login. The testing branch may contain changes not yet deployed; production automatic scheduling has not been verified.',
    details: ['Separate manual and automatic scraping workflows.', 'Configurable discovery periods, locations, keywords, and website limits.', 'AI extraction across 27 event-information fields and Fit Score assessment.', 'Automatic qualification of relevant Fit Score 3–5 events.', 'Edition-aware duplicate detection and callback replay protection.', 'Review queue with approval/rejection, submission-origin tags, and date filters.', 'Dashboard charts showing event distribution, business-line alignment, and coverage gaps.', 'Role-based access for users, administrators, and superadministrators.', 'Background scraping with saved progress, results, and run history.', 'Vercel cron integration for checking saved discovery schedules.'],
    stack: ['Next.js 14', 'React 18', 'TypeScript', 'Tailwind CSS', 'Radix UI', 'Framer Motion', 'Lucide React', 'Zustand', 'React Hook Form', 'Zod', 'Recharts', 'D3 Geo', 'TopoJSON', 'Next.js API routes', 'Node.js', 'Express', 'PostgreSQL', 'Prisma', 'NextAuth.js', 'bcrypt', 'Apify', 'Cheerio', 'Google Gemini API', 'Vercel', 'Vercel cron', 'Railway scraper engine', 'Node.js test runner', 'Mocked providers', 'Isolated PostgreSQL test schemas', 'ESLint', 'TypeScript checks'],
    image: '/projects/lifevent-device-cutout.png', imageAlt: 'Lifevent technology exhibition intelligence landing page displayed on a laptop, tablet and phone', imageKind: 'mockup', tone: 'green', featured: true,
    liveUrl: 'https://phlifevent.vercel.app', repositoryUrl: 'https://github.com/LifewoodPH/Lifevent', implementationUrl: 'https://github.com/LifewoodPH/Lifevent/tree/testing',
  },
  {
    id: 'elven', title: 'Elven Boutique', category: 'Development', discipline: 'Full-stack / E-commerce',
    summary: 'A floral storefront with thoughtful commerce beneath the petals.',
    description: 'A full-stack floral e-commerce application connecting a customer storefront with an admin workspace. A considered interface meets layered APIs and careful data integrity.',
    details: ['Customer storefront and administrative tools for managing commerce.', 'Order cancellation with inventory restocking; soft-delete behavior preserves historical integrity.', 'PDF reports generated with jsPDF and layered APIs for a maintainable backend.'],
    stack: ['React 19', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'Prisma', 'TanStack Query', 'Zod', 'jsPDF'],
    image: '/projects/elven-boutique-device-cutout.png', imageAlt: 'Elven Boutique floral storefront displayed on a laptop, tablet and phone', imageKind: 'mockup', tone: 'pink', featured: true, headline: 'GOOD THINGS\nTAKE ROOT.',
  },
  {
    id: 'laundry', title: "Sofia’s Bubble’s Laundry App", category: 'Development', discipline: 'Web application / Operations',
    summary: 'Making the everyday laundry workflow a little clearer.',
    description: 'A laundry management application with an interface for following orders, notifications, and inventory.',
    details: ['Order tracking for laundry workflows.', 'Notifications to keep order information visible.', 'Inventory management built into the application.'],
    stack: ['React', 'TypeScript', 'Tailwind CSS'], image: '/projects/sofia-laundry-device-cutout.png', imageAlt: 'Sofia’s Laundry sign-in interface displayed on a laptop, tablet and phone', imageKind: 'mockup', tone: 'blue',
  },
  {
    id: 'registration', title: 'Student Registration App', category: 'Development', discipline: 'Full-stack / Education',
    summary: 'Enrollment, courses, and student records in one considered flow.',
    description: 'A registration application pairing a React interface with a Node.js and Express backend and a relational database.',
    details: ['Enrollment workflows and course management.', 'Student record organization using a relational database.', 'Server-side validation for registration data.'],
    stack: ['React', 'Node.js', 'Express', 'Relational database'], image: '/projects/student-registration-device-cutout.png', imageAlt: 'Student portal with digital ID and course information on a laptop, tablet and phone', imageKind: 'mockup', tone: 'yellow',
  },
  {
    id: 'marine', title: 'Marine Biodegradation', category: 'AI & research', discipline: 'Machine learning / Environmental research',
    summary: 'Exploring where computation meets ocean conservation.',
    description: 'An in-silico research project exploring plastics degradation under ocean conditions through Python, data analysis, and machine learning.',
    details: ['Data-driven investigation of synthetic plastics degradation.', 'Machine learning exploration of marine environmental conditions.', 'Computational research at the intersection of engineering and environmental science; no experimental outcomes are claimed here.'],
    stack: ['Python', 'Data analysis', 'Machine learning', 'In-silico research'], image: '/projects/marine-biodegradation-illustration.png', imageAlt: 'Conceptual ocean conservation artwork with a sea turtle, schooling fish and coral', imageKind: 'illustration', tone: 'green', headline: 'A DIFFERENT\nKIND OF DEEP DIVE.',
  },
  {
    id: 'antifungal', title: 'Antifungal Molecule Design', category: 'AI & research', discipline: 'Computational biology / Molecular design',
    summary: 'Computational approaches to a complex biological challenge.',
    description: 'An in-silico exploration of antifungal molecule design against Candida auris, using molecular docking and QSAR methods.',
    details: ['Computational biology research focused on Candida auris.', 'Molecular docking to explore candidate interactions.', 'QSAR methods for investigating molecular properties; no clinical efficacy is claimed.'],
    stack: ['Molecular docking', 'QSAR', 'Computational biology'], image: '/projects/antifungal-molecule-illustration.png', imageAlt: 'Conceptual molecular design artwork with a ball-and-stick molecule and yeast cells', imageKind: 'illustration', tone: 'pink',
  },
  {
    id: 'educaite', title: 'EducAIte', category: 'Development', discipline: 'AI / Web Application',
    summary: 'A study companion for making sense of the next big idea.',
    description: 'An AI-assisted learning application bringing tutoring, summaries, and study planning into a React and TypeScript experience.',
    details: ['LLM-powered tutoring experiences.', 'Study summaries to organize learning material.', 'Planners to support study organization.'],
    stack: ['React', 'TypeScript', 'LLM integration', 'Tailwind CSS'], image: '/projects/educaite-device-cutout.png', imageAlt: 'EducAIte AI learning landing page displayed on a laptop, tablet and phone', imageKind: 'mockup', tone: 'blue', featured: true, headline: 'BIG IDEAS.\nLESS FRICTION.',
  },
  {
    id: 'pasabuy', title: 'Pasabuy', category: 'UI/UX', discipline: 'UX research / Product design',
    summary: 'Shared neighborhood errands, designed around real journeys.',
    description: 'A UX design exploration of shared neighborhood errands, translating user journeys into wireframes and Figma designs.',
    details: ['Journey mapping for shared errands in a neighborhood context.', 'Wireframes exploring the experience and its core flows.', 'Figma designs connecting user needs with an intuitive interface.'],
    stack: ['Figma', 'User journeys', 'Wireframing', 'UI/UX design'], image: '/projects/pasabuy-device-cutout.png', imageAlt: 'Pasabuy courier dashboard and onboarding displayed on a laptop, tablet and phone', imageKind: 'mockup', tone: 'orange', headline: 'SMALL ERRANDS.\nSHARED CONNECTIONS.',
  },
];
export const featuredProjects = ['educaite', 'floodsense', 'lifevent', 'elven'].map(id => projects.find(p => p.id === id)!);
export const experience = [
  { date: '2024 — present', role: 'Freelance designer & developer', place: 'Christian.dev', detail: 'Bringing intuitive, user-centered design and scalable engineering together.' },
  { date: '2026', role: 'Full Stack AI Engineer', place: 'Lifewood Data Technology', detail: 'Building connected web interfaces, backend services, and AI integrations to turn complex workflows into practical tools.' },
  { date: '2023 — 2024', role: 'Environmental project', place: 'University of Cebu – Main Campus', detail: 'Exploring the intersection of environmental research and technology.' },
  { date: '2023 — present', role: 'Computer Science student', place: 'University of Cebu — Main Campus', detail: '4th-year CS student, looking for work opportunities.' },
];
export const skills = {
  Design: [
    { label: 'Understand', items: ['User journeys', 'Journey mapping', 'Usability', 'User-centered design'] },
    { label: 'Shape', items: ['Figma', 'FigJam', 'Wireframing', 'Prototyping', 'UI/UX design'] },
    { label: 'Collaborate', items: ['Agile', 'Design–development collaboration'] },
  ],
  Development: [
    { label: 'Interface', items: ['React 19', 'TypeScript', 'JavaScript', 'Next.js', 'Vite', 'Tailwind CSS', 'Motion', 'TanStack Query', 'Frontend architecture', 'Component development', 'Voice assistant interfaces'] },
    { label: 'Systems', items: ['Node.js', 'Express', 'NestJS', '.NET 8', 'C#', 'PostgreSQL', 'SQLite', 'Prisma', 'Zod', 'JWT', 'Git', 'Agile', 'System architecture', 'API integration', 'Automated web scraping'] },
    { label: 'Intelligence', items: ['Python', 'Machine learning', 'Molecular docking', 'QSAR', 'AI automation', 'Prompt engineering', 'AI agent integration', 'HeyGen', 'NotebookLM', 'Text-to-image tools'] },
    { label: 'Delivery', items: ['Team Git workflows', 'Branch merging', 'Repository migration', 'Environment configuration', 'Deployment troubleshooting', 'Runtime debugging', 'Local feature testing', 'Release management'] },
  ],
  General: [
    { label: 'People', items: ['Communication', 'Teamwork', 'Leadership', 'Stakeholder alignment', 'Client & mentor communication', 'Receiving & applying feedback'] },
    { label: 'Work habits', items: ['Flexibility', 'Multitasking', 'Problem solving', 'Documentation writing', 'Punctuality', 'Fast learning', 'Working under pressure', 'Organization', 'Following procedures'] },
    { label: 'Project planning', items: ['Timeline planning', 'Task allocation', 'Prioritization', 'Managing changing requirements', 'Technical handovers', 'Production planning'] },
    { label: 'Reporting & reach', items: ['Power BI', 'Google Data Studio', 'Business intelligence reporting', 'Data visualization', 'Presenting insights', 'SEO', 'AEO', 'GEO', 'Digital content distribution'] },
  ],
};
