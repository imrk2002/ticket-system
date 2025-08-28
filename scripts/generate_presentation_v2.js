const fs = require('fs');
const path = require('path');
const PptxGenJS = require('pptxgenjs');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

const palette = {
  bgDark: '0F172A', // slate-900
  bgLight: 'F8FAFC', // slate-50
  primary: '14B8A6', // teal-500
  accent: '6366F1', // indigo-500
  textLight: 'FFFFFF',
  textDark: '0F172A',
  subtle: '64748B', // slate-500
};

function titleSlide(p) {
  const s = p.addSlide();
  s.background = { color: palette.bgDark };
  s.addText('Bus Ticket System', { x: 0.5, y: 1.2, w: 9, h: 1, fontSize: 46, bold: true, color: palette.textLight, align: 'center' });
  s.addText('Simple, microservices-based bus ticket reservation platform', { x: 0.5, y: 2.2, w: 9, h: 0.7, fontSize: 22, color: palette.primary, align: 'center' });
  s.addText('Stack: Flask • MySQL • Angular • Docker Compose', { x: 0.5, y: 3.0, w: 9, h: 0.5, fontSize: 16, color: palette.textLight, align: 'center' });
}

function descriptionSlide(p) {
  const s = p.addSlide();
  s.background = { color: palette.bgLight };
  s.addText('What is this project?', { x: 0.6, y: 0.6, w: 8.8, h: 0.6, fontSize: 34, bold: true, color: palette.textDark });
  const bullets = [
    'A web app to search bus trips, book seats, and view your bookings.',
    'Built as small services that each do one job well.',
    'Designed to be easy to run locally or in the cloud.',
  ];
  s.addText(bullets.map(b => `• ${b}`).join('\n'), { x: 0.9, y: 1.6, w: 8.2, h: 4.6, fontSize: 20, color: palette.textDark, lineSpacing: 30 });
}

function architectureStyleSlide(p) {
  const s = p.addSlide();
  s.background = { color: palette.bgLight };
  s.addText('Architecture Style: Microservices', { x: 0.6, y: 0.6, w: 8.8, h: 0.6, fontSize: 34, bold: true, color: palette.textDark });
  const bullets = [
    'Each service is its own small app (schedule, reservation, frontend).',
    'Services talk over simple HTTP (REST).',
    'Each service owns its data (separate MySQL databases).',
    'Stateless services; user login uses a token (JWT).',
  ];
  s.addText(bullets.map(b => `• ${b}`).join('\n'), { x: 0.9, y: 1.6, w: 8.2, h: 4.6, fontSize: 20, color: palette.textDark, lineSpacing: 30 });
}

function architectureDiagramSlide(p) {
  const s = p.addSlide();
  s.background = { color: '111827' }; // slate-800
  s.addText('High-level Architecture', { x: 0.6, y: 0.6, w: 8.8, h: 0.6, fontSize: 32, bold: true, color: palette.textLight });

  // Frontend
  s.addShape(p.ShapeType.roundRect, { x: 0.6, y: 1.6, w: 2.8, h: 1.2, fill: { color: '0EA5E9' }, line: { color: '075985' } });
  s.addText('Angular\nFrontend', { x: 0.6, y: 1.7, w: 2.8, h: 1.0, fontSize: 16, color: palette.textLight, align: 'center' });

  // Services
  s.addShape(p.ShapeType.roundRect, { x: 3.6, y: 1.6, w: 2.8, h: 1.2, fill: { color: '34D399' }, line: { color: '065F46' } });
  s.addText('Bus Schedule\nService', { x: 3.6, y: 1.7, w: 2.8, h: 1.0, fontSize: 16, color: palette.textDark, align: 'center' });

  s.addShape(p.ShapeType.roundRect, { x: 6.6, y: 1.6, w: 2.8, h: 1.2, fill: { color: 'F472B6' }, line: { color: '9D174D' } });
  s.addText('Reservation\nService', { x: 6.6, y: 1.7, w: 2.8, h: 1.0, fontSize: 16, color: palette.textLight, align: 'center' });

  // Databases
  s.addShape(p.ShapeType.flowChartMagneticDisk, { x: 3.8, y: 3.1, w: 2.4, h: 1.2, fill: { color: 'A7F3D0' }, line: { color: '065F46' } });
  s.addText('schedule_db', { x: 3.8, y: 3.45, w: 2.4, h: 0.6, fontSize: 14, color: palette.textDark, align: 'center' });
  s.addShape(p.ShapeType.flowChartMagneticDisk, { x: 6.8, y: 3.1, w: 2.4, h: 1.2, fill: { color: 'FBCFE8' }, line: { color: '9D174D' } });
  s.addText('reservation_db', { x: 6.8, y: 3.45, w: 2.4, h: 0.6, fontSize: 14, color: palette.textDark, align: 'center' });

  // Arrows
  s.addShape(p.ShapeType.line, { x: 3.4, y: 2.2, w: 0.2, h: 0, line: { color: palette.textLight, width: 2, endArrowType: 'triangle' } });
  s.addShape(p.ShapeType.line, { x: 6.4, y: 2.2, w: 0.2, h: 0, line: { color: palette.textLight, width: 2, endArrowType: 'triangle' } });
  s.addText('HTTP/REST + JWT', { x: 2.0, y: 1.2, w: 5.0, h: 0.4, fontSize: 12, color: palette.textLight, align: 'center' });
}

function serviceScheduleSlide(p) {
  const s = p.addSlide();
  s.background = { color: palette.bgLight };
  s.addText('Bus Schedule Service (What it does)', { x: 0.6, y: 0.6, w: 8.8, h: 0.6, fontSize: 32, bold: true, color: palette.textDark });
  const bullets = [
    'Keeps a list of routes (from city → to city).',
    'Creates trips with dates, times, and total seats.',
    'Tracks how many seats are still available.',
    'Gives other services a safe way to reserve and release seats.',
  ];
  s.addText(bullets.map(b => `• ${b}`).join('\n'), { x: 0.9, y: 1.6, w: 8.2, h: 4.6, fontSize: 20, color: palette.textDark, lineSpacing: 30 });
}

function serviceScheduleAPISlide(p) {
  const s = p.addSlide();
  s.background = { color: palette.bgLight };
  s.addText('Bus Schedule Service (APIs)', { x: 0.6, y: 0.6, w: 8.8, h: 0.6, fontSize: 30, bold: true, color: palette.textDark });
  const items = [
    'GET /health – check the service is up',
    'POST /routes; GET /routes – manage routes',
    'POST /trips – add a new trip',
    'GET /trips/search – find trips by origin, destination, and date',
    'GET /trips/{id} – trip details',
    'GET /trips/{id}/availability – remaining seats',
    'POST /trips/{id}/allocate – hold seats atomically',
    'POST /trips/{id}/release – give seats back',
  ];
  s.addText(items.map(i => `• ${i}`).join('\n'), { x: 0.9, y: 1.5, w: 8.2, h: 5, fontSize: 18, color: palette.textDark, lineSpacing: 26 });
}

function serviceReservationSlide(p) {
  const s = p.addSlide();
  s.background = { color: palette.bgLight };
  s.addText('Reservation Service (What it does)', { x: 0.6, y: 0.6, w: 8.8, h: 0.6, fontSize: 32, bold: true, color: palette.textDark });
  const bullets = [
    'Lets users log in and get a token (JWT).',
    'Books seats by asking the Schedule Service to allocate them.',
    'Cancels bookings and releases seats back.',
    'Shows booking history; admins can see everyone’s bookings.',
  ];
  s.addText(bullets.map(b => `• ${b}`).join('\n'), { x: 0.9, y: 1.6, w: 8.2, h: 4.6, fontSize: 20, color: palette.textDark, lineSpacing: 30 });
}

function serviceReservationAPISlide(p) {
  const s = p.addSlide();
  s.background = { color: palette.bgLight };
  s.addText('Reservation Service (APIs)', { x: 0.6, y: 0.6, w: 8.8, h: 0.6, fontSize: 30, bold: true, color: palette.textDark });
  const items = [
    'GET /health – basic check',
    'POST /auth/login – returns a JWT token',
    'POST /reservations – create a booking',
    'POST /reservations/{id}/cancel – cancel a booking',
    'GET /reservations; GET /reservations/{id} – view bookings',
  ];
  s.addText(items.map(i => `• ${i}`).join('\n'), { x: 0.9, y: 1.5, w: 8.2, h: 5, fontSize: 18, color: palette.textDark, lineSpacing: 26 });
}

function frontendSlide(p) {
  const s = p.addSlide();
  s.background = { color: palette.bgLight };
  s.addText('Angular Frontend (What users see)', { x: 0.6, y: 0.6, w: 8.8, h: 0.6, fontSize: 32, bold: true, color: palette.textDark });
  const bullets = [
    'Pages: Search, Booking, History, Admin, and Login.',
    'Sends requests to the services and includes your token (JWT).',
    'Easy to switch to any API base URL (local or cloud).',
  ];
  s.addText(bullets.map(b => `• ${b}`).join('\n'), { x: 0.9, y: 1.6, w: 8.2, h: 4.6, fontSize: 20, color: palette.textDark, lineSpacing: 30 });
}

function dataFlowSlide(p) {
  const s = p.addSlide();
  s.background = { color: palette.bgLight };
  s.addText('How a booking works (step by step)', { x: 0.6, y: 0.6, w: 8.8, h: 0.6, fontSize: 32, bold: true, color: palette.textDark });
  const steps = [
    '1) User searches trips (Frontend → Schedule Service).',
    '2) User logs in and gets a token (Frontend → Reservation Service).',
    '3) User clicks Book; Reservation Service checks seats and asks Schedule Service to allocate.',
    '4) Reservation Service saves the booking and returns success.',
    '5) If user cancels, Reservation Service releases seats back on Schedule Service.',
  ];
  s.addText(steps.join('\n'), { x: 0.9, y: 1.6, w: 8.2, h: 5.0, fontSize: 20, color: palette.textDark, lineSpacing: 30 });
}

function containerizationSlide(p) {
  const s = p.addSlide();
  s.background = { color: palette.bgLight };
  s.addText('Containerization (in simple terms)', { x: 0.6, y: 0.6, w: 8.8, h: 0.6, fontSize: 32, bold: true, color: palette.textDark });
  const bullets = [
    'A container = a tiny, isolated box with everything an app needs.',
    'We run 4 containers: MySQL, Bus Schedule, Reservation, Frontend.',
    'They share a private network so they can talk to each other.',
    'MySQL keeps its data in a volume so it survives restarts.',
  ];
  s.addText(bullets.map(b => `• ${b}`).join('\n'), { x: 0.9, y: 1.6, w: 8.2, h: 4.6, fontSize: 20, color: palette.textDark, lineSpacing: 30 });
}

function deploymentTheorySlide(p) {
  const s = p.addSlide();
  s.background = { color: palette.bgLight };
  s.addText('Deployment (how it’s wired, not code)', { x: 0.6, y: 0.6, w: 8.8, h: 0.6, fontSize: 32, bold: true, color: palette.textDark });
  const bullets = [
    'Use Docker Compose to start all containers with one command.',
    'MySQL starts first; services wait until the database is healthy.',
    'Bus Schedule and Reservation expose ports (5001, 5002) to the host.',
    'Frontend is served via Nginx on port 4200 and calls the APIs.',
    'Environment variables configure DB credentials and service URLs.',
  ];
  s.addText(bullets.map(b => `• ${b}`).join('\n'), { x: 0.9, y: 1.6, w: 8.2, h: 4.6, fontSize: 20, color: palette.textDark, lineSpacing: 30 });
}

function securitySlide(p) {
  const s = p.addSlide();
  s.background = { color: palette.bgLight };
  s.addText('Security basics', { x: 0.6, y: 0.6, w: 8.8, h: 0.6, fontSize: 32, bold: true, color: palette.textDark });
  const bullets = [
    'Login returns a signed token (JWT) that the browser stores.',
    'The frontend sends this token with each request.',
    'User roles: ADMIN and USER (controls what you can do/see).',
    'Change the JWT secret in production and use HTTPS.',
  ];
  s.addText(bullets.map(b => `• ${b}`).join('\n'), { x: 0.9, y: 1.6, w: 8.2, h: 4.6, fontSize: 20, color: palette.textDark, lineSpacing: 30 });
}

function summarySlide(p) {
  const s = p.addSlide();
  s.background = { color: palette.bgDark };
  s.addText('In short…', { x: 0.6, y: 0.8, w: 8.8, h: 0.6, fontSize: 34, bold: true, color: palette.textLight });
  const bullets = [
    'Small, focused services keep the system simple and reliable.',
    'Clear APIs and token-based auth make integration straightforward.',
    'Containers make it easy to run the same way everywhere.',
  ];
  s.addText(bullets.map(b => `• ${b}`).join('\n'), { x: 0.9, y: 1.7, w: 8.2, h: 4.6, fontSize: 20, color: palette.primary, lineSpacing: 30 });
}

function build() {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  titleSlide(pptx);
  descriptionSlide(pptx);
  architectureStyleSlide(pptx);
  architectureDiagramSlide(pptx);
  serviceScheduleSlide(pptx);
  serviceScheduleAPISlide(pptx);
  serviceReservationSlide(pptx);
  serviceReservationAPISlide(pptx);
  frontendSlide(pptx);
  dataFlowSlide(pptx);
  containerizationSlide(pptx);
  deploymentTheorySlide(pptx);
  securitySlide(pptx);
  summarySlide(pptx);

  const outDir = path.join('/workspace', 'docs');
  ensureDir(outDir);
  const outFile = path.join(outDir, 'Bus_Ticket_System_Presentation_v2.pptx');
  return pptx.writeFile({ fileName: outFile }).then(() => {
    console.log('Wrote', outFile);
  });
}

build();

