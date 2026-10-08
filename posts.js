/**
 * ============================================================================
 * BLOG POSTS DATABASE & REPOSITORY
 * ============================================================================
 * 
 * HOW TO ADD A NEW BLOG POST:
 * 1. Copy the POST TEMPLATE below.
 * 2. Fill in your details (title, slug, date, app, content sections).
 * 3. Add the object to the top of the `blogPosts` array.
 * 4. Save and push to your GitHub repository!
 * 
 * Alternatively, click the "+ New Post" button on the Blog page to use the
 * built-in editor and copy the generated post code!
 * 
 * TEMPLATE:
 * {
 *   id: "your-app-slug",
 *   title: "Your Post Title",
 *   date: "Oct 2026",
 *   readTime: "4 min read",
 *   appId: "dentai", // matching id in projects.js (optional)
 *   appTitle: "DentAI Analytics",
 *   appUrl: "https://dentai.ainibot.com", // live demo or app URL (optional)
 *   githubUrl: "https://github.com/EF361/...", // repo URL (optional)
 *   coverImage: "images/projects/dentai/analytics-page.png",
 *   tags: ["AI", "Python", "Computer Vision"],
 *   excerpt: "A short 1-2 sentence overview of what you built and why.",
 *   content: `
 *     <p>Your introductory thoughts...</p>
 *     <h2>The Problem & Motivation</h2>
 *     <p>What problem did this app solve?</p>
 *     <h2>Technical Architecture</h2>
 *     <p>How did you build it? What libraries or algorithms were used?</p>
 *     <pre><code>// Example code if any</code></pre>
 *     <h2>Key Challenges & Solutions</h2>
 *     <p>What hurdles did you overcome?</p>
 *     <h2>Key Takeaways</h2>
 *     <p>What did you learn from building this project?</p>
 *   `
 * }
 * ============================================================================
 */

const blogPosts = [
  {
    id: "dentai-analytics",
    title: "Developing DentAI Analytics: AI-Assisted Dental Imaging & Diagnostic Insights",
    date: "Oct 2024",
    readTime: "5 min read",
    appId: "dentai",
    appTitle: "DentAI Analytics",
    appUrl: "https://dentai.ainibot.com",
    githubUrl: "",
    coverImage: "images/projects/dentai/analytics-page.png",
    tags: ["AI", "Computer Vision", "Healthcare", "Analytics"],
    excerpt: "How I architected an AI-powered diagnostic platform to enhance dental radiography analysis, improve report precision, and support clinical decision-making.",
    content: `
      <p>Dental radiography interpretation is one of the most detail-intensive tasks in modern clinical practice. Clinicians inspect dozens of scans daily, identifying subtle pathologies, marginal defects, bone loss, and caries. <strong>DentAI Analytics</strong> was born out of an ambition to create a dependable, clinician-friendly assistant that speeds up visual inspection without replacing expert human oversight.</p>

      <h2>The Problem: Cognitive Load in Clinical Imaging</h2>
      <p>Traditional diagnostic workflows rely heavily on manual scanning across panoramic, periapical, and bitewing X-rays. In high-volume clinics, eye fatigue and time constraints can lead to overlooked anomalies or inconsistent records. I wanted to build an end-to-end interface that highlights areas of interest in real-time, summarizes morphological findings, and generates exportable clinical summaries.</p>

      <h2>System Architecture & Tech Stack</h2>
      <p>DentAI Analytics was built with a modular approach:</p>
      <ul>
        <li><strong>Image Processing Pipeline:</strong> Preprocessing filters for contrast enhancement, CLAHE (Contrast Limited Adaptive Histogram Equalization), and noise reduction to standardize variable-quality radiographs.</li>
        <li><strong>Computer Vision Models:</strong> Convolutional networks fine-tuned on dental datasets to classify tooth structures, segment restorations, and detect potential periapical lesions.</li>
        <li><strong>Web Interface:</strong> A clean dashboard prioritizing responsive scan comparison, annotated overlays with toggleable masks, and structured diagnostic reporting.</li>
      </ul>

      <pre><code># Core preprocessing: Adaptive histogram equalization for radiograph contrast
import cv2
import numpy as np

def enhance_radiograph(image_matrix):
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray = cv2.cvtColor(image_matrix, cv2.COLOR_BGR2GRAY) if len(image_matrix.shape) == 3 else image_matrix
    enhanced = clahe.apply(gray)
    return cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)</code></pre>

      <h2>Key Challenges & How I Solved Them</h2>
      <p>The primary hurdle was false positives caused by metallic artifacts (amalgam fillings, dental crowns, orthodontic hardware) which cause high-intensity blooming in radiographic imagery. To resolve this, I introduced artifact suppression masks that isolate high-density dental hardware before passing tooth margin contours to the lesion detection model.</p>

      <h2>Impact & Next Steps</h2>
      <p>DentAI Analytics taught me the importance of interpretability in medical AI. Clinicians don't just need a classification label; they need heatmaps, bounding areas, and confidence thresholds. In the future, I plan to integrate patient history comparison to track bone-level progression over successive checkups.</p>
    `
  },
  {
    id: "smart-recycling-robot",
    title: "Building an Autonomous Recycling Robot with MicroPython and LEGO EV3",
    date: "Sep 2024",
    readTime: "6 min read",
    appId: "smart-recycling-robot",
    appTitle: "Smart Recycling Robot",
    appUrl: "",
    githubUrl: "https://github.com/EF361/recyling_robot",
    coverImage: "images/projects/smart-recycling-robot/playground.jpg",
    tags: ["Robotics", "MicroPython", "IoT", "Hardware", "Sensors"],
    excerpt: "Engineering an autonomous sorting robot from scratch using LEGO Mindstorms EV3, MicroPython control loops, and multi-sensor material classification.",
    content: `
      <p>Waste sorting is one of the most labor-intensive stages in recycling workflows. During this project, our team engineered an autonomous mobile robot capable of detecting, collecting, and categorizing waste items into proper bins based on physical and optical properties.</p>

      <h2>Hardware & Sensor Configuration</h2>
      <p>The robot was constructed around the LEGO Mindstorms EV3 intelligent brick running an optimized MicroPython kernel. The hardware included:</p>
      <ul>
        <li><strong>Dual Large Motors:</strong> Differential drive chassis providing tight zero-radius turn capabilities for navigating confined sorting arenas.</li>
        <li><strong>Medium Motor Gripper:</strong> A gear-reduction claw mechanism that grasps and securely lifts materials.</li>
        <li><strong>Color & Reflectance Sensor:</strong> Used for tracking line pathways and inspecting RGB spectral reflection of waste materials.</li>
        <li><strong>Ultrasonic Sensor:</strong> Continuous obstacle detection and distance gauging to locate target items in the playground arena.</li>
      </ul>

      <h2>The MicroPython Control Architecture</h2>
      <p>Programming in MicroPython gave us low-latency control loops compared to standard block-based programming environments. We structured the state machine into 4 key phases:</p>
      <ol>
        <li><em>Arena Patrol:</em> Line-following with PID control along designated grid corridors.</li>
        <li><em>Proximity Trigger:</em> Ultrasonic scan verifying the presence and dimension of an object.</li>
        <li><em>Material Analysis:</em> Reflectance thresholding to categorize recyclable paper, plastics, and metallic composites.</li>
        <li><em>Sorting & Deposit:</em> Pathing to the corresponding disposal container and releasing the payload.</li>
      </ol>

      <pre><code>from pybricks.ev3devices import Motor, ColorSensor, UltrasonicSensor
from pybricks.parameters import Port, Stop
from pybricks.tools import wait

class RecyclingRover:
    def __init__(self):
        self.left_motor = Motor(Port.B)
        self.right_motor = Motor(Port.C)
        self.claw = Motor(Port.A)
        self.color_sensor = ColorSensor(Port.S3)
        self.sonar = UltrasonicSensor(Port.S4)
        
    def scan_and_grasp(self):
        distance = self.sonar.distance()
        if distance < 80:  # mm
            self.claw.run_target(200, 90, then=Stop.HOLD)
            return True
        return False</code></pre>

      <h2>Key Learnings</h2>
      <p>Bridging pure code with physical hardware was an eye-opener. MicroPython handled deterministic timing gracefully, but physical variables like battery discharge curves and wheel slippage required adaptive error correction algorithms. The project solidified my love for embedded systems and automation.</p>
    `
  },
  {
    id: "pdf-fusion-pro",
    title: "PDF Fusion Pro: Building a Privacy-First PDF Utility with Streamlit & Python",
    date: "Jul 2024",
    readTime: "4 min read",
    appId: "pdf-fusion-pro",
    appTitle: "PDF Fusion Pro",
    appUrl: "https://mergepdfwizard.streamlit.app",
    githubUrl: "https://github.com/EF361/pdf_merger",
    coverImage: "images/projects/pdf-fusion-pro/dashboard.png",
    tags: ["Python", "Streamlit", "PDF", "Productivity"],
    excerpt: "Why upload sensitive personal documents to third-party ad-ridden PDF sites? Here is how I built a fast, client-conscious PDF merger and organizer using Python.",
    content: `
      <p>How many times have you needed to merge three bank statements or combine certificate scans, only to find yourself searching for online PDF tools that demand email signups, limit file counts, or upload your private documents to unknown cloud servers?</p>
      <p>I built <strong>PDF Fusion Pro</strong> to solve this nuisance once and for all: a lightweight, clean, and instant PDF manipulation workspace built using Python and Streamlit.</p>

      <h2>Core Objectives</h2>
      <ul>
        <li><strong>Privacy Priority:</strong> Keep document processing strictly within memory without saving permanent copies to third-party databases.</li>
        <li><strong>Zero Clutter:</strong> Clean drag-and-drop file staging with dynamic page reordering.</li>
        <li><strong>Speed:</strong> Instant client-side download generation using memory buffer streams (<code>io.BytesIO</code>).</li>
      </ul>

      <h2>Under the Hood: PyPDF & In-Memory Streaming</h2>
      <p>By leveraging <code>pypdf</code> along with Python's standard <code>io.BytesIO</code>, the merger reads files directly from the uploaded stream and compiles the concatenated document without touching physical disk storage:</p>

      <pre><code>import io
from pypdf import PdfWriter, PdfReader

def merge_documents(uploaded_file_list):
    writer = PdfWriter()
    for uploaded_file in uploaded_file_list:
        reader = PdfReader(uploaded_file)
        for page in reader.pages:
            writer.add_page(page)
            
    output_stream = io.BytesIO()
    writer.write(output_stream)
    output_stream.seek(0)
    return output_stream</code></pre>

      <h2>User Experience & Streamlit Enhancements</h2>
      <p>Streamlit is fantastic for rapid prototyping, but crafting an intuitive document workbench required custom CSS touches: custom progress chips, instant page count calculations, and immediate file size summaries. The app is deployed live on Streamlit Cloud and handles everyday file merging in seconds.</p>
    `
  },
  {
    id: "custom-flappy-bird",
    title: "Custom Flappy Bird: Crafting Smooth Physics & Difficulty Curves in Pygame",
    date: "May 2024",
    readTime: "4 min read",
    appId: "flappy-bird",
    appTitle: "Custom Flappy Bird",
    appUrl: "",
    githubUrl: "https://github.com/EF361/flappy-bird",
    coverImage: "images/projects/flappy-bird/gameplay.png",
    tags: ["Python", "Pygame", "Game Development", "Physics"],
    excerpt: "An exploration into 2D game loops, delta time physics calculations, custom sprite rotations, and progressive difficulty balancing with Python Pygame.",
    content: `
      <p>While game engines like Unity or Godot make 2D arcade physics effortless, building an arcade game from scratch in <strong>Python with Pygame</strong> is one of the most rewarding exercises in systems engineering and mathematical modeling.</p>

      <h2>The Mechanics: It's All in the Jump Curve</h2>
      <p>The iconic feel of Flappy Bird relies on rapid instantaneous lift coupled with smooth gravity acceleration and angle tilting. If gravity is linear, the flight feels floaty; if acceleration is too abrupt, the player feels cheated. Here is how the velocity curve was tuned:</p>

      <pre><code>class Bird:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.velocity = 0
        self.gravity = 0.55
        self.jump_strength = -8.5
        self.max_fall_speed = 10.0
        self.tilt = 0

    def jump(self):
        self.velocity = self.jump_strength
        self.tilt = 25  # Angled upwards

    def update(self):
        self.velocity = min(self.velocity + self.gravity, self.max_fall_speed)
        self.y += self.velocity
        
        # Tilt downwards during freefall
        if self.velocity > 0:
            self.tilt = max(self.tilt - 3, -75)</code></pre>

      <h2>Progressive Difficulty & Settings</h2>
      <p>Rather than a static arcade game, I built a configuration menu enabling players to customize themes, pipe spacing, game speeds, and audio triggers. As the score crosses milestones, pipe spacing dynamically tightens and vertical gap offsets increase, creating an addictive learning curve.</p>

      <h2>Takeaway</h2>
      <p>Building the game solidified my appreciation for frame-rate independence, collision mask accuracy (using <code>pygame.mask.from_surface</code> for pixel-perfect collision rather than bounding boxes), and clean state architecture.</p>
    `
  }
];

if (typeof window !== "undefined") {
  window.blogPosts = blogPosts;
}
