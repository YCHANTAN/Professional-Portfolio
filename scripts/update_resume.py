"""Update the portfolio resume while preserving its Arial, ruled, single-column format."""
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/pdf'
OUT.mkdir(parents=True, exist_ok=True)
TARGET = OUT / 'Christian-Osorno-Resume-updated.pdf'
for name, filename in [('Arial', 'arial.ttf'), ('Arial-Bold', 'arialbd.ttf'), ('Arial-Italic', 'ariali.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(Path('C:/Windows/Fonts') / filename)))
pdfmetrics.registerFontFamily('Arial', normal='Arial', bold='Arial-Bold', italic='Arial-Italic', boldItalic='Arial-Bold')

c = canvas.Canvas(str(TARGET), pagesize=(612, 792))
c.setTitle('Christian A. Osorno - Resume')
c.setAuthor('Christian A. Osorno')
LEFT, RIGHT, WIDTH = 56.6, 558, 501.4
y = 670
body = ParagraphStyle('Body', fontName='Arial', fontSize=9.96, leading=13.4, textColor=HexColor('#111111'))
small = ParagraphStyle('Small', parent=body, fontSize=9, leading=12)

def paragraph(text, gap=4, x=LEFT, width=WIDTH, style=body):
    global y
    p = Paragraph(text, style)
    _, height = p.wrap(width, 700)
    if y - height < 45:
        raise ValueError(f'Page overflow: {text[:80]} at {y}')
    p.drawOn(c, x, y - height)
    y -= height + gap

def section(title, gap=13):
    global y
    y -= gap
    c.setFont('Arial-Bold', 12)
    c.setFillColor(HexColor('#2a2a2a'))
    c.drawString(LEFT, y - 12, title)
    c.setStrokeColor(HexColor('#111111'))
    c.setLineWidth(.8)
    c.line(LEFT, y - 19, RIGHT, y - 19)
    y -= 29

def entry(title, right='', subtitle=None):
    global y
    right_width = pdfmetrics.stringWidth(right, 'Arial-Bold', 9.96) if right else 0
    available = WIDTH - right_width - (12 if right else 0)
    old_y = y
    paragraph(f'<b>{escape(title)}</b>', gap=3, width=available)
    if right:
        c.setFont('Arial-Bold', 9.96)
        c.setFillColor(HexColor('#2a2a2a'))
        c.drawRightString(RIGHT, old_y - 10, right)
    if subtitle:
        paragraph(f'<i>{escape(subtitle)}</i>', gap=3)

def bullet(text, gap=3):
    global y
    c.setFont('Arial', 9.96)
    c.setFillColor(HexColor('#111111'))
    c.drawString(65.4, y - 10, '\u2022')
    paragraph(text, gap=gap, x=71.7, width=RIGHT-71.7)

def skill_row(label, text):
    global y
    top = y
    paragraph(escape(text), gap=4, x=154.5, width=RIGHT-154.5)
    c.setFont('Arial-Bold', 9.96)
    c.drawString(LEFT, top-10, label)

# Preserve the original centered name, contact line, and passport photo.
c.drawImage(str(ROOT / 'scripts/resume-assets/portrait.jpg'), 494.85, 708.77, width=63.15, height=62.228)
c.setFont('Arial-Bold', 24)
c.setFillColor(HexColor('#111111'))
c.drawCentredString(306, 713.8, 'CHRISTIAN A. OSORNO')
contact = ParagraphStyle('Contact', parent=small, alignment=1)
y = 697
paragraph('<link href="mailto:christianosorno20@gmail.com" color="blue"><u>christianosorno20@gmail.com</u></link>  |  09271410824  |  <link href="https://github.com/YCHANTAN">github.com/YCHANTAN</link>  |  <link href="https://linkedin.com/in/christian-osorno-2742a4379/">linkedin.com/in/christian-osorno-2742a4379</link>', gap=0, style=contact)
y = 670
section('EDUCATION', gap=0)
entry('University of Cebu - Main Campus', 'Expected 2027', 'Bachelor of Science in Computer Science')
bullet("<b>Academic Honors:</b> Dean's List (Multiple Semesters).")
bullet('<b>Relevant Coursework:</b> Data Structures &amp; Algorithms, Object-Oriented Programming, Database Management Systems, Operating Systems, Machine Learning, Software Engineering.')
bullet('<b>Leadership:</b> University Student Officer (Sergeant at Arms), P.I.O. on Peer Support Group, SSG Grade 12 Representative, and Scrabble Team Leader.')

section('EXPERIENCE')
entry('Full Stack AI Engineer | Lifewood Data Technology', '2026')
bullet('Contributed to web interfaces, backend services, API integration, automated scraping, application debugging, and local feature testing.')
bullet('Coordinated project timelines, task allocation, stakeholder feedback, technical handovers, and team Git, integration, and deployment workflows.')
bullet('Created Power BI and Google Data Studio dashboards and presentations; applied prompt engineering and generative AI tools in technical workflows.')
y -= 5
entry('Freelance Designer & Developer', '2024 - present')
bullet('Combining intuitive, user-centered design with scalable web engineering for practical digital experiences.')

section('TECHNICAL SKILLS')
skill_row('Languages:', 'JavaScript, TypeScript, SQL, HTML/CSS, Python, C#')
skill_row('Frameworks:', 'React, Next.js, Node.js, Express, FastAPI, NestJS, Tailwind CSS, .NET, Pandas, Scikit-learn')
skill_row('Tools & Tech:', 'Git/GitHub, Docker, REST APIs, WebSockets, PostgreSQL, Prisma, Drizzle ORM, Figma, Mapbox/MapLibre')
skill_row('AI & Reporting:', 'Gemini API, AI agent integration, prompt engineering, Power BI, Google Data Studio, HeyGen, NotebookLM')

section('GENERAL SKILLS')
bullet('Communication, teamwork, leadership, stakeholder alignment, documentation, and receiving and applying feedback.')
bullet('Project planning, task allocation, prioritization, technical handovers, organization, and following procedures.')
bullet('Problem solving, flexibility, multitasking, punctuality, fast learning, and working under pressure; SEO, AEO, GEO, and digital content distribution.')

c.showPage()
c.setFillColor(HexColor('#111111'))
c.setFont('Arial-Bold', 12)
c.drawCentredString(306, 750, 'CHRISTIAN A. OSORNO')
y = 730
section('PROJECTS', gap=0)

entry('EducAIte | React, TypeScript, Tailwind CSS', 'Early 2026')
bullet('AI-assisted learning application with LLM-powered tutoring, study summaries, and planning in a responsive web interface.')
y -= 6
entry('FloodSense | React, Next.js, PostgreSQL, Gemini')
bullet('Full-Stack Developer &amp; System Architect for a Metro Cebu geospatial platform combining community flood reports, interactive maps, and a domain-bounded AI safety assistant.')
bullet('Integrated rainfall, tidal proximity, elevation, and historical flood susceptibility into a multi-factor risk engine, with community voting and an offline assistant fallback.')
y -= 6
entry('Lifevent | Next.js, Prisma, Apify, Gemini', 'Collaborative')
bullet('Contributed to the dashboard interface, scraper integration, automatic qualification pipeline, review queue, duplicate handling, bug fixes, and deployment documentation.')
paragraph('<link href="https://phlifevent.vercel.app" color="blue"><u>Live demo</u></link> | <link href="https://github.com/LifewoodPH/Lifevent" color="blue"><u>Source code</u></link> | <link href="https://github.com/LifewoodPH/Lifevent/tree/testing" color="blue"><u>Implementation branch</u></link> - Some features require login; testing-branch changes may not be deployed.', gap=7, x=71.7, width=RIGHT-71.7, style=small)

entry('Elven Boutique | React, Express, PostgreSQL, Prisma')
bullet('Full-stack floral storefront and admin workspace with inventory restocking on cancellation, historical-data preservation, layered APIs, and jsPDF reports.')
y -= 6
entry('GourMate | React, Three.js, FastAPI, Gemini', 'Collaborative')
bullet('AI cooking companion with conversational recipes, guided steps, ingredient substitutions, timers, multilingual speech, and Kef, an animated 3D chef.')
bullet('Team: Erica Gin Echavez, Christian Osorno, and Christian Kyle Ducay.')
paragraph('<link href="https://gour-mate.vercel.app/" color="blue"><u>Live demo</u></link> | <link href="https://github.com/Zycheee/GourMate" color="blue"><u>Source code</u></link>', gap=7, x=71.7, width=RIGHT-71.7, style=small)

entry('Student Registration App | React, Node.js, Express')
bullet('Registration application supporting enrollment, course management, student records, relational data storage, and server-side validation.')
y -= 6
entry("Sofia's Bubble's Laundry App | React, TypeScript")
bullet('Laundry management interface for order tracking, notifications, and inventory workflows.')
y -= 6
entry('Marine Biodegradation | Python, Machine Learning', 'Late 2025')
bullet('University of Cebu - Main Campus: in-silico research exploring synthetic plastics degradation under ocean conditions through data analysis and machine learning.')
y -= 6
entry('Antifungal Molecule Design | Molecular Docking, QSAR')
bullet('In-silico exploration of candidate antifungal molecules against Candida auris using molecular docking and QSAR methods.')
y -= 6
entry('Pasabuy | Figma, UX Research, UI/UX Design')
bullet('Shared-errand design exploration using user journeys, wireframes, and Figma interfaces for courier and commissioner flows.')

c.save()
with pdfplumber.open(TARGET) as doc:
    assert len(doc.pages) == 2
    text = '\n'.join(page.extract_text() or '' for page in doc.pages)
    assert '\ufffd' not in text, 'Broken characters in text extraction'
    for term in ['Lifewood Data Technology', 'FloodSense', 'Lifevent', 'GourMate', 'Elven Boutique', 'GENERAL SKILLS']:
        assert term in text, term
    for index, page in enumerate(doc.pages, 1):
        page.to_image(resolution=140).save(ROOT / f'test-results/resume-updated-{index}.png')
print(f'Created {TARGET}; 2 pages; final content ends at y={y:.1f}')
