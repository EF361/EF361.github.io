/*
 * Project metadata only. Media is discovered automatically from
 * images/projects/<project-id>/ by app.js when the site runs on GitHub Pages.
 */
const projectMetadata = {
    "flappy-bird": {
        title: "Custom Flappy Bird",
        description: "A Python arcade game with custom physics, settings, and progressive difficulty.",
        tags: ["Python", "Pygame", "Game Development"]
    },
    "smart-recycling-robot": {
        title: "Smart Recycling Robot",
        description: "An autonomous LEGO EV3 recycling prototype that sorts materials with sensors and MicroPython.",
        tags: ["Robotics", "IoT", "MicroPython", "Hardware"]
    },
    dentai: {
        title: "DentAI Analytics",
        description: "An AI-assisted dental imaging and analytics experience for clearer diagnostic insights.",
        tags: ["AI", "Computer Vision", "Healthcare", "Analytics"]
    },
    "mindcraft-puzzle": {
        title: "Mindcraft Puzzle",
        description: "A polished logic-puzzle platform with player dashboards, themes, and interactive challenges.",
        tags: ["Web App", "JavaScript", "UI/UX", "Puzzles"]
    },
    "pdf-fusion-pro": {
        title: "PDF Fusion Pro",
        description: "A privacy-minded Streamlit tool for merging and managing PDF files.",
        tags: ["Python", "Streamlit", "PDF", "Productivity"]
    },
    "elderly-management": {
        title: "Elderly Management System",
        description: "A care-management application designed to make day-to-day elderly support easier to coordinate.",
        tags: ["Python", "Streamlit", "Care Tech"]
    },
    "epf-calculator": {
        title: "EPF Calculator",
        description: "A focused financial calculator for exploring EPF contribution scenarios.",
        tags: ["Python", "Streamlit", "Finance"]
    },
    invoice: {
        title: "Invoice Generator",
        description: "A streamlined application for preparing professional invoices quickly.",
        tags: ["Python", "Streamlit", "Productivity"]
    },
    "mermaid-editor": {
        title: "Mermaid Editor",
        description: "A practical editor for creating and refining Mermaid diagrams.",
        tags: ["Developer Tool", "Diagrams", "Web App"]
    },
    icrawler: {
        title: "iCrawler",
        description: "A friendly interface for collecting image datasets from the web.",
        tags: ["Python", "Streamlit", "Automation", "Data"]
    },
    passgen: {
        title: "PassGen: Cryptographic Password Generator",
        description: "A high-security password generator built with Next.js and the Web Crypto API ensuring pattern resistance and zero modulo bias.",
        tags: ["Next.js", "TypeScript", "Web Crypto API", "Security"]
    },
    "human-atlas": {
        title: "Human Atlas 3D",
        description: "An interactive 3D human anatomy atlas built with WebGL and React for visual medical and anatomical exploration.",
        tags: ["Three.js", "React", "WebGL", "Interactive 3D"]
    },
    "kind-borg": {
        title: "VisualProof Studio (Kind-Borg)",
        description: "An automated screen capture and media encoding pipeline with FFmpeg and Puppeteer for high-fidelity recording workflows.",
        tags: ["Node.js", "Puppeteer", "FFmpeg", "Automation"]
    }
};

/* Offline/local fallback. GitHub discovery replaces these lists when available. */
const projectAssetFallback = {
    dentai: ["images/projects/dentai/analytics-page.png"],
    "elderly-management": ["images/projects/elderly-management/dashboard.png"],
    "epf-calculator": ["images/projects/epf-calculator/dashboard.png"],
    "flappy-bird": [
        "images/projects/flappy-bird/gameplay.png",
        "images/projects/flappy-bird/home-page.png",
        "images/projects/flappy-bird/setting-page.png"
    ],
    "human-atlas": [
        "images/projects/human-atlas/heart.png",
        "images/projects/human-atlas/lungs.png",
        "images/projects/human-atlas/brain.png",
        "images/projects/human-atlas/kidney.png",
        "images/projects/human-atlas/skull.png",
        "images/projects/human-atlas/skeleton.png"
    ],
    icrawler: ["images/projects/icrawler/dashboard.png"],
    invoice: ["images/projects/invoice/dashboard.png"],
    "kind-borg": [
        "images/projects/kind-borg/virtual-apparatus.png",
        "images/projects/kind-borg/studio-dashboard.png",
        "images/projects/kind-borg/visualproof-demo.gif",
        "images/projects/kind-borg/architecture-flowchart.gif"
    ],
    "mermaid-editor": ["images/projects/mermaid-editor/preview.png"],
    "mindcraft-puzzle": [
        "images/projects/mindcraft-puzzle/dashboard-dark.png",
        "images/projects/mindcraft-puzzle/dashboard-light.png",
        "images/projects/mindcraft-puzzle/level-selection.png",
        "images/projects/mindcraft-puzzle/account-page.png",
        "images/projects/mindcraft-puzzle/sudoku.png",
        "images/projects/mindcraft-puzzle/minesweeper.png",
        "images/projects/mindcraft-puzzle/math-puzzle.png",
        "images/projects/mindcraft-puzzle/nonogram.png",
        "images/projects/mindcraft-puzzle/block-blast.png",
        "images/projects/mindcraft-puzzle/whisker-grid.png"
    ],
    passgen: [
        "images/projects/passgen/dashboard-dark.png",
        "images/projects/passgen/passphrase-mode.png",
        "images/projects/passgen/batch-generator.png",
        "images/projects/passgen/session-history.png",
        "images/projects/passgen/dashboard-light.png"
    ],
    "pdf-fusion-pro": ["images/projects/pdf-fusion-pro/dashboard.png"],
    "smart-recycling-robot": [
        "images/projects/smart-recycling-robot/playground.jpg",
        "images/projects/smart-recycling-robot/team-photo.jpg",
        "images/projects/smart-recycling-robot/robot-video.mp4",
        "images/projects/smart-recycling-robot/robot-poster.pdf"
    ]
};
