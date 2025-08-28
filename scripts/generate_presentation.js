const fs = require('fs');
const path = require('path');
const PptxGenJS = require('pptxgenjs');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function addTitleSlide(pptx) {
  const slide = pptx.addSlide();
  slide.addText('Bus Ticket System', { x: 0.5, y: 1.2, w: 9, h: 1, fontSize: 44, bold: true, align: 'center' });
  slide.addText('End-to-end microservices-based ticket reservation platform', {
    x: 0.5,
    y: 2.2,
    w: 9,
    h: 1,
    fontSize: 20,
    color: '666666',
    align: 'center',
  });
  slide.addText('Stack: Flask, MySQL, Angular, Docker Compose', { x: 0.5, y: 3, w: 9, h: 0.6, fontSize: 16, color: '666666', align: 'center' });
}

function addDescriptionSlide(pptx) {
  const slide = pptx.addSlide();
  slide.addText('Project Description', { x: 0.5, y: 0.6, w: 9, h: 0.6, fontSize: 32, bold: true });
  const bullets = [
    'A bus ticket reservation system with trip search, booking, and history.',
    'Two Flask microservices: Bus Schedule and Reservation.',
    'MySQL databases for schedule and reservations.',
    'Angular frontend for search, booking, admin and history views.',
  ];
  slide.addText(bullets.map((t) => `• ${t}`).join('\n'), { x: 0.7, y: 1.5, w: 8.6, h: 4.5, fontSize: 18, lineSpacing: 28 });
}

function addArchitectureTypeSlide(pptx) {
  const slide = pptx.addSlide();
  slide.addText('Architecture Style', { x: 0.5, y: 0.6, w: 9, h: 0.6, fontSize: 32, bold: true });
  slide.addText('Microservices Architecture', { x: 0.7, y: 1.6, w: 8.6, h: 0.6, fontSize: 22, bold: true });
  const bullets = [
    'Independent deployable services (Bus Schedule, Reservation, Frontend).',
    'Explicit service boundaries, each with its own database.',
    'Synchronous communication via REST over HTTP.',
    'Stateless services; session handled via JWT on the client.',
  ];
  slide.addText(bullets.map((t) => `• ${t}`).join('\n'), { x: 0.7, y: 2.4, w: 8.6, h: 4.5, fontSize: 18, lineSpacing: 28 });
}

function addArchitectureDiagramSlide(pptx) {
  const slide = pptx.addSlide();
  slide.addText('High-level Architecture', { x: 0.5, y: 0.6, w: 9, h: 0.6, fontSize: 32, bold: true });

  // Frontend box
  slide.addShape(pptx.ShapeType.roundRect, { x: 0.5, y: 1.5, w: 2.8, h: 1.2, fill: { color: 'F3F4F6' }, line: { color: '4B5563' } });
  slide.addText('Angular Frontend', { x: 0.5, y: 1.9, w: 2.8, h: 0.6, fontSize: 16, align: 'center' });

  // Services boxes
  slide.addShape(pptx.ShapeType.roundRect, { x: 3.7, y: 1.5, w: 2.8, h: 1.2, fill: { color: 'DBEAFE' }, line: { color: '1D4ED8' } });
  slide.addText('Bus Schedule\nService', { x: 3.7, y: 1.7, w: 2.8, h: 1, fontSize: 16, align: 'center' });

  slide.addShape(pptx.ShapeType.roundRect, { x: 6.9, y: 1.5, w: 2.8, h: 1.2, fill: { color: 'FFE4E6' }, line: { color: 'BE123C' } });
  slide.addText('Reservation\nService', { x: 6.9, y: 1.7, w: 2.8, h: 1, fontSize: 16, align: 'center' });

  // Databases
  slide.addShape(pptx.ShapeType.flowChartMagneticDisk, { x: 3.9, y: 3.1, w: 2.4, h: 1.2, fill: { color: 'DBEAFE' }, line: { color: '1D4ED8' } });
  slide.addText('schedule_db', { x: 3.9, y: 3.45, w: 2.4, h: 0.6, fontSize: 14, align: 'center' });

  slide.addShape(pptx.ShapeType.flowChartMagneticDisk, { x: 7.1, y: 3.1, w: 2.4, h: 1.2, fill: { color: 'FFE4E6' }, line: { color: 'BE123C' } });
  slide.addText('reservation_db', { x: 7.1, y: 3.45, w: 2.4, h: 0.6, fontSize: 14, align: 'center' });

  // Arrows
  slide.addShape(pptx.ShapeType.line, { x: 3.3, y: 2.1, w: 0.4, h: 0, line: { color: '4B5563', width: 2, beginArrowType: 'none', endArrowType: 'triangle' } });
  slide.addShape(pptx.ShapeType.line, { x: 6.5, y: 2.1, w: 0.4, h: 0, line: { color: '4B5563', width: 2, beginArrowType: 'none', endArrowType: 'triangle' } });
  slide.addShape(pptx.ShapeType.line, { x: 4.95, y: 2.7, w: 0, h: 0.35, line: { color: '1D4ED8', width: 2, beginArrowType: 'none', endArrowType: 'triangle' } });
  slide.addShape(pptx.ShapeType.line, { x: 8.15, y: 2.7, w: 0, h: 0.35, line: { color: 'BE123C', width: 2, beginArrowType: 'none', endArrowType: 'triangle' } });

  slide.addText('HTTP/REST + JWT', { x: 1.8, y: 1.2, w: 6, h: 0.4, fontSize: 12, color: '6B7280', align: 'center' });
}

function addServiceOverviewSlides(pptx) {
  // Bus Schedule Service
  let slide = pptx.addSlide();
  slide.addText('Bus Schedule Service', { x: 0.5, y: 0.6, w: 9, h: 0.6, fontSize: 32, bold: true });
  const bullets1 = [
    'Manages routes, trips, and seat availability.',
    'Own database: schedule_db.',
    'Endpoints:',
    'GET /health',
    'POST /routes; GET /routes',
    'POST /trips',
    'GET /trips/search?origin&destination&date',
    'GET /trips/{id}',
    'GET /trips/{id}/availability',
    'POST /trips/{id}/allocate; POST /trips/{id}/release',
  ];
  slide.addText(bullets1.map((t, i) => (i <= 2 ? t : `• ${t}`)).join('\n'), { x: 0.7, y: 1.5, w: 8.6, h: 5, fontSize: 18, lineSpacing: 28 });

  // Reservation Service
  slide = pptx.addSlide();
  slide.addText('Reservation Service', { x: 0.5, y: 0.6, w: 9, h: 0.6, fontSize: 32, bold: true });
  const bullets2 = [
    'Handles bookings, cancellations, and authentication (JWT).',
    'Own database: reservation_db.',
    'Endpoints:',
    'GET /health',
    'POST /auth/login',
    'POST /reservations',
    'POST /reservations/{id}/cancel',
    'GET /reservations; GET /reservations/{id}',
  ];
  slide.addText(bullets2.map((t, i) => (i <= 2 ? t : `• ${t}`)).join('\n'), { x: 0.7, y: 1.5, w: 8.6, h: 5, fontSize: 18, lineSpacing: 28 });

  // Frontend
  slide = pptx.addSlide();
  slide.addText('Angular Frontend', { x: 0.5, y: 0.6, w: 9, h: 0.6, fontSize: 32, bold: true });
  const bullets3 = [
    'Provides Search, Booking, History, and Admin views.',
    'Communicates with services over REST, adds JWT to requests.',
    'Routes: /, /login, /admin-login, /book/:id, /history, /admin',
  ];
  slide.addText(bullets3.map((t) => `• ${t}`).join('\n'), { x: 0.7, y: 1.5, w: 8.6, h: 5, fontSize: 18, lineSpacing: 28 });
}

function addContainerizationSlide(pptx) {
  const slide = pptx.addSlide();
  slide.addText('Containerization', { x: 0.5, y: 0.6, w: 9, h: 0.6, fontSize: 32, bold: true });
  const bullets = [
    'Containers: mysql:8.0, bus-schedule (Flask), reservation (Flask), frontend (Nginx).',
    'Internal bridge network for inter-service communication.',
    'Volumes: persistent MySQL data.',
    'Healthchecks: MySQL with mysqladmin ping.',
  ];
  slide.addText(bullets.map((t) => `• ${t}`).join('\n'), { x: 0.7, y: 1.5, w: 8.6, h: 5, fontSize: 18, lineSpacing: 28 });
}

function addDeploymentSlide(pptx, composeYaml) {
  const slide = pptx.addSlide();
  slide.addText('Deployment (Docker Compose)', { x: 0.5, y: 0.6, w: 9, h: 0.6, fontSize: 32, bold: true });
  const code = composeYaml
    .split('\n')
    .slice(0, 20)
    .join('\n');
  slide.addText(code, { x: 0.6, y: 1.5, w: 8.8, h: 4.2, fontSize: 11, fontFace: 'Courier New' });

  const slide2 = pptx.addSlide();
  slide2.addText('Deployment (Docker Compose, cont.)', { x: 0.5, y: 0.6, w: 9, h: 0.6, fontSize: 28, bold: true });
  const code2 = composeYaml
    .split('\n')
    .slice(20)
    .join('\n');
  slide2.addText(code2, { x: 0.6, y: 1.2, w: 8.8, h: 4.8, fontSize: 11, fontFace: 'Courier New' });
}

function addAPISummarySlide(pptx) {
  const slide = pptx.addSlide();
  slide.addText('API Summary', { x: 0.5, y: 0.6, w: 9, h: 0.6, fontSize: 32, bold: true });
  const bullets = [
    'Schedule: /routes, /trips, /trips/search, /trips/{id}, /availability, /allocate, /release',
    'Reservation: /auth/login, /reservations, /reservations/{id}, /cancel',
    'Auth: JWT (HS256), Authorization: Bearer <token>',
  ];
  slide.addText(bullets.map((t) => `• ${t}`).join('\n'), { x: 0.7, y: 1.5, w: 8.6, h: 5, fontSize: 18, lineSpacing: 28 });
}

function addConclusionSlide(pptx) {
  const slide = pptx.addSlide();
  slide.addText('Conclusion', { x: 0.5, y: 0.8, w: 9, h: 0.6, fontSize: 32, bold: true });
  const bullets = [
    'Modular microservices with clear ownership and scalability.',
    'Secure bookings via JWT and atomic seat allocation.',
    'Simple deployment with Docker Compose.',
  ];
  slide.addText(bullets.map((t) => `• ${t}`).join('\n'), { x: 0.7, y: 1.7, w: 8.6, h: 5, fontSize: 18, lineSpacing: 28 });
}

function main() {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';

  const composePath = path.join('/workspace', 'docker-compose.yml');
  const composeYaml = fs.readFileSync(composePath, 'utf8');

  addTitleSlide(pptx);
  addDescriptionSlide(pptx);
  addArchitectureTypeSlide(pptx);
  addArchitectureDiagramSlide(pptx);
  addServiceOverviewSlides(pptx);
  addAPISummarySlide(pptx);
  addContainerizationSlide(pptx);
  addDeploymentSlide(pptx, composeYaml);
  addConclusionSlide(pptx);

  const outDir = path.join('/workspace', 'docs');
  ensureDir(outDir);
  const outFile = path.join(outDir, 'Bus_Ticket_System_Presentation.pptx');
  pptx.writeFile({ fileName: outFile }).then(() => {
    console.log('Wrote', outFile);
  });
}

main();

