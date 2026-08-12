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
    }
};

/* Offline/local fallback. GitHub discovery replaces these lists when available. */
const projectAssetFallback = {
    dentai: ["images/projects/dentai/analytics-page.png"],
    "flappy-bird": [
        "images/projects/flappy-bird/gameplay.png",
        "images/projects/flappy-bird/home-page.png",
        "images/projects/flappy-bird/setting-page.png"
    ],
    "mindcraft-puzzle": [
        "images/projects/mindcraft-puzzle/dashboard-dark.png",
        "images/projects/mindcraft-puzzle/dashboard-light.png",
        "images/projects/mindcraft-puzzle/sudoku.png",
        "images/projects/mindcraft-puzzle/account-page.png"
    ],
    "pdf-fusion-pro": ["images/projects/pdf-fusion-pro/dashboard.png"],
    "smart-recycling-robot": [
        "images/projects/smart-recycling-robot/playground.jpg",
        "images/projects/smart-recycling-robot/team-photo.jpg",
        "images/projects/smart-recycling-robot/robot-video.mp4",
        "images/projects/smart-recycling-robot/robot-poster.pdf"
    ]
};
