const projectsData = [
    {
        id: 1,
        title: "LinkedIn Content Scout",
        description: "An automated content scouting tool utilizing n8n workflows and LLMs.",
        fullDescription: "LinkedIn Content Scout is a robust automation pipeline built entirely on n8n. It leverages advanced LLMs to identify, curate, and format trending content directly from LinkedIn. It significantly reduces manual scouting time and provides highly actionable insights for content creators.",
        motivation: "I was spending hours manually scrolling through LinkedIn to find relevant industry trends. I wanted a set-and-forget system that could intelligently extract high-value posts and summarize them for me.",
        image: "./images/project1.png",
        extraImages: ["./images/project1-extra1.png", "./images/project1-extra2.png"],
        tags: ["n8n", "LLMs", "Automation", "Workflow"],
        link: "#",
        githubLink: "https://github.com/EF361/linkedin-content-scout"
    },
    {
        id: 2,
        title: "iCrawler",
        description: "An open-source, Streamlit-based web crawler that extracts deep text data and sub-URLs into clean JSON formats.",
        fullDescription: "iCrawler is designed to be a highly efficient and visual web crawler. Built with Python and Streamlit, it provides a user-friendly interface where users can input seed URLs, configure crawling depth, and watch real-time data extraction. The output is structured JSON, perfect for RAG data ingestion.",
        motivation: "Preparing data for Retrieval-Augmented Generation (RAG) models often required tedious scraping scripts. iCrawler bridges the gap by offering a no-code interface for complex, deep-level data extraction.",
        image: "./images/project2.png",
        extraImages: ["./images/project2-extra1.png"],
        tags: ["Python", "Streamlit", "Web Scraping", "Data"],
        link: "#",
        githubLink: "https://github.com/EF361/icrawler"
    },
    {
        id: 3,
        title: "PDF Fusion Pro",
        description: "A secure, local-first web application built with Streamlit to merge and encrypt PDF documents.",
        fullDescription: "PDF Fusion Pro solves the privacy concerns associated with online PDF editors. By running locally via Streamlit, it allows users to merge multiple PDFs, rearrange pages, and apply heavy AES encryption without ever transmitting sensitive documents over the internet.",
        motivation: "I needed to merge confidential financial documents but did not trust free online tools. Building a local, secure solution was the safest approach.",
        image: "./images/project3.png",
        extraImages: [],
        tags: ["Python", "Streamlit", "Security", "Tools"],
        link: "#",
        githubLink: "https://github.com/EF361/pdf-fusion-pro"
    },
    {
        id: 4,
        title: "Zeno Time",
        description: "A minimalist focus timer application, part of the companion-driven Zeno mobile ecosystem.",
        fullDescription: "Zeno Time uses the Pomodoro technique wrapped in a distraction-free, minimalist UI. It integrates smoothly into the broader Zeno ecosystem, tracking focus sessions and providing analytics to help users optimize their productivity rhythms.",
        motivation: "To combat digital fatigue, I wanted an aesthetic, bloat-free timer that felt like an extension of the phone's native OS, rather than a clunky third-party app.",
        image: "./images/project4.png",
        extraImages: ["./images/project4-extra1.png"],
        tags: ["Mobile", "Productivity", "UI/UX"],
        link: "#",
        githubLink: "https://github.com/EF361/zeno-time"
    },
    {
        id: 5,
        title: "Smart Recycling Robot",
        description: "An IoT hardware project built with LEGO EV3 and color sensors using Micropython.",
        fullDescription: "This hardware project uses Micropython running on a LEGO EV3 brick. It incorporates light, color, and ultrasonic sensors to identify and sort recyclable materials automatically. The robot operates autonomously, making real-time sorting decisions based on sensor input thresholds.",
        motivation: "A passion project exploring the intersection of IoT and sustainability. I wanted to prove that complex, automated physical sorting could be achieved with accessible hardware.",
        image: "./images/project5.png",
        extraImages: ["./images/project5-extra1.png", "./images/project5-extra2.png"],
        tags: ["IoT", "Micropython", "Hardware", "Robotics"],
        link: "#",
        githubLink: "https://github.com/EF361/smart-recycling-robot"
    },
    {
        id: 6,
        title: "Custom Flappy Bird",
        description: "A recreation of the classic game using Pygame, featuring progressive difficulty and custom audio.",
        fullDescription: "A fully playable clone of Flappy Bird built entirely in Python using the Pygame library. It features pixel-perfect collision detection, a customized physics engine for jumping/falling, progressive difficulty scaling, and a custom synthesized soundtrack.",
        motivation: "I wanted to deepen my understanding of game loops, physics logic, and object-oriented programming in Python.",
        image: "./images/project6.png",
        extraImages: [],
        tags: ["Python", "Pygame", "Game Dev"],
        link: "#",
        githubLink: "https://github.com/EF361/custom-flappy-bird"
    }
];
