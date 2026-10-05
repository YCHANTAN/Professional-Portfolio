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
  image: string; imageAlt: string; tone: 'pink' | 'orange' | 'blue' | 'green' | 'yellow';
  featured?: boolean; headline?: string;
}
const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&q=85`;
export const projects: Project[] = [
  {
    id: 'elven', title: 'Elven Boutique', category: 'Development', discipline: 'Full-stack / E-commerce',
    summary: 'A floral storefront with thoughtful commerce beneath the petals.',
    description: 'A full-stack floral e-commerce application connecting a customer storefront with an admin workspace. A considered interface meets layered APIs and careful data integrity.',
    details: ['Customer storefront and administrative tools for managing commerce.', 'Order cancellation with inventory restocking; soft-delete behavior preserves historical integrity.', 'PDF reports generated with jsPDF and layered APIs for a maintainable backend.'],
    stack: ['React 19', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'Prisma', 'TanStack Query', 'Zod', 'jsPDF'],
    image: photo('photo-1526047932273-341f2a7631f9'), imageAlt: 'Illustrative still-life photograph of a colorful bouquet', tone: 'pink', featured: true, headline: 'GOOD THINGS\nTAKE ROOT.',
  },
  {
    id: 'laundry', title: "Sofia’s Bubble’s Laundry App", category: 'Development', discipline: 'Web application / Operations',
    summary: 'Making the everyday laundry workflow a little clearer.',
    description: 'A laundry management application with an interface for following orders, notifications, and inventory.',
    details: ['Order tracking for laundry workflows.', 'Notifications to keep order information visible.', 'Inventory management built into the application.'],
    stack: ['React', 'TypeScript', 'Tailwind CSS'], image: photo('photo-1517677208171-0bc6725a3e60'), imageAlt: 'Illustrative photograph of laundry', tone: 'blue',
  },
  {
    id: 'registration', title: 'Student Registration App', category: 'Development', discipline: 'Full-stack / Education',
    summary: 'Enrollment, courses, and student records in one considered flow.',
    description: 'A registration application pairing a React interface with a Node.js and Express backend and a relational database.',
    details: ['Enrollment workflows and course management.', 'Student record organization using a relational database.', 'Server-side validation for registration data.'],
    stack: ['React', 'Node.js', 'Express', 'Relational database'], image: photo('photo-1523240795612-9a054b0db644'), imageAlt: 'Illustrative photograph of students working together, not Christian', tone: 'yellow',
  },
  {
    id: 'marine', title: 'Marine Biodegradation', category: 'AI & research', discipline: 'Machine learning / Environmental research',
    summary: 'Exploring where computation meets ocean conservation.',
    description: 'An in-silico research project exploring plastics degradation under ocean conditions through Python, data analysis, and machine learning.',
    details: ['Data-driven investigation of synthetic plastics degradation.', 'Machine learning exploration of marine environmental conditions.', 'Computational research at the intersection of engineering and environmental science; no experimental outcomes are claimed here.'],
    stack: ['Python', 'Data analysis', 'Machine learning', 'In-silico research'], image: photo('photo-1437622368342-7a3d73a34c8f'), imageAlt: 'Illustrative photograph of a sea turtle underwater', tone: 'green', featured: true, headline: 'A DIFFERENT\nKIND OF DEEP DIVE.',
  },
  {
    id: 'antifungal', title: 'Antifungal Molecule Design', category: 'AI & research', discipline: 'Computational biology / Molecular design',
    summary: 'Computational approaches to a complex biological challenge.',
    description: 'An in-silico exploration of antifungal molecule design against Candida auris, using molecular docking and QSAR methods.',
    details: ['Computational biology research focused on Candida auris.', 'Molecular docking to explore candidate interactions.', 'QSAR methods for investigating molecular properties; no clinical efficacy is claimed.'],
    stack: ['Molecular docking', 'QSAR', 'Computational biology'], image: photo('photo-1614850523296-d8c1af93d400'), imageAlt: 'Illustrative colorful abstract forms, not molecular simulation output', tone: 'pink',
  },
  {
    id: 'educaite', title: 'EducAIte', category: 'AI & research', discipline: 'AI / Learning experience',
    summary: 'A study companion for making sense of the next big idea.',
    description: 'An AI-assisted learning application bringing tutoring, summaries, and study planning into a React and TypeScript experience.',
    details: ['LLM-powered tutoring experiences.', 'Study summaries to organize learning material.', 'Planners to support study organization.'],
    stack: ['React', 'TypeScript', 'LLM integration', 'Tailwind CSS'], image: photo('photo-1677442136019-21780ecad995'), imageAlt: 'Illustrative abstract artificial intelligence image, not an application screenshot', tone: 'blue', featured: true, headline: 'BIG IDEAS.\nLESS FRICTION.',
  },
  {
    id: 'pasabuy', title: 'Pasabuy', category: 'UI/UX', discipline: 'UX research / Product design',
    summary: 'Shared neighborhood errands, designed around real journeys.',
    description: 'A UX design exploration of shared neighborhood errands, translating user journeys into wireframes and Figma designs.',
    details: ['Journey mapping for shared errands in a neighborhood context.', 'Wireframes exploring the experience and its core flows.', 'Figma designs connecting user needs with an intuitive interface.'],
    stack: ['Figma', 'User journeys', 'Wireframing', 'UI/UX design'], image: photo('photo-1551650975-87deedd944c3'), imageAlt: 'Illustrative photograph of phones, not a Pasabuy screenshot', tone: 'orange', featured: true, headline: 'SMALL ERRANDS.\nSHARED CONNECTIONS.',
  },
];
export const featuredProjects = ['elven', 'pasabuy', 'educaite', 'marine'].map(id => projects.find(p => p.id === id)!);
export const experience = [
  { date: '2024 — present', role: 'Freelance designer & developer', place: 'Christian.dev', detail: 'Bringing intuitive, user-centered design and scalable engineering together.' },
  { date: '2024', role: 'UI/UX Design Intern', place: 'PixelCraft Studios', detail: 'Journey mapping, Figma prototyping, and usability.' },
  { date: '2023 — 2024', role: 'Environmental project', place: 'Coral Triangle Center', detail: 'Exploring the intersection of environmental research and technology.' },
  { date: '2023 — present', role: 'Computer Science student', place: 'University of Cebu — Main Campus', detail: '4th-year CS student, seeking a 240-hour internship.' },
];
export const skills = {
  Design: [
    { label: 'Understand', items: ['User journeys', 'Journey mapping', 'Usability', 'User-centered design'] },
    { label: 'Shape', items: ['Figma', 'FigJam', 'Wireframing', 'Prototyping', 'UI/UX design'] },
    { label: 'Collaborate', items: ['Agile', 'Design–development collaboration'] },
  ],
  Development: [
    { label: 'Interface', items: ['React 19', 'TypeScript', 'JavaScript', 'Next.js', 'Vite', 'Tailwind CSS', 'Motion', 'TanStack Query'] },
    { label: 'Systems', items: ['Node.js', 'Express', 'NestJS', '.NET 8', 'C#', 'PostgreSQL', 'SQLite', 'Prisma', 'Zod', 'JWT', 'Git', 'Agile'] },
    { label: 'Intelligence', items: ['Python', 'Machine learning', 'Molecular docking', 'QSAR', 'AI automation'] },
  ],
};
