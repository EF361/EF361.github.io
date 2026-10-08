(() => {
    "use strict";

    const REPOSITORY = "EF361/EF361.github.io";
    const BRANCH = "main";
    const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);
    const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov"]);
    const DOCUMENT_EXTENSIONS = new Set(["pdf"]);
    const SUPPORTED_EXTENSIONS = new Set([...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS, ...DOCUMENT_EXTENSIONS]);
    const MAX_COLLAPSED_CERTIFICATES = 6;
    const MAX_COLLAPSED_PROJECTS = 4;

    const state = {
        projects: [],
        projectsExpanded: false,
        certificates: [],
        certificateFilter: "All",
        certificatesExpanded: false
    };

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
    const extensionOf = path => path.split(".").pop().toLowerCase();
    const encodePath = path => path.split("/").map(encodeURIComponent).join("/");
    const fileUrl = path => encodePath(path);
    const titleCase = value => value
        .replace(/\.[^.]+$/, "")
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, letter => letter.toUpperCase())
        .replace(/'S\b/g, "'s")
        .replace(/\bPdf\b/g, "PDF")
        .replace(/\bAi\b/g, "AI")
        .replace(/\bEpf\b/g, "EPF");
    const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[character]);
    const safeUrl = value => {
        if (!value) return "";
        const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
        try {
            const url = new URL(normalized);
            return ["http:", "https:"].includes(url.protocol) ? url.href : "";
        } catch {
            return "";
        }
    };

    async function fetchWithTimeout(url, timeout = 7000) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
            return response;
        } finally {
            clearTimeout(timer);
        }
    }

    async function discoverRepositoryFiles() {
        const cacheKey = "portfolio-repository-tree-v3";
        try {
            const cached = JSON.parse(sessionStorage.getItem(cacheKey) || "null");
            if (cached && Date.now() - cached.savedAt < 60 * 1000) return cached.paths;
        } catch { /* A blocked storage API should not block the portfolio. */ }

        const apiUrl = `https://api.github.com/repos/${REPOSITORY}/git/trees/${BRANCH}?recursive=1`;
        const response = await fetchWithTimeout(apiUrl);
        const payload = await response.json();
        const paths = (payload.tree || []).filter(item => item.type === "blob").map(item => item.path);
        try {
            sessionStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), paths }));
        } catch { /* Ignore storage quota/privacy mode. */ }
        return paths;
    }

    async function readProjectLinks() {
        try {
            const response = await fetchWithTimeout(`github-url.txt?updated=${Date.now()}`, 4000);
            return parseProjectLinks(await response.text());
        } catch {
            return {};
        }
    }

    function parseProjectLinks(text) {
        const projects = {};
        let currentId = "";
        text.split(/\r?\n/).forEach(rawLine => {
            const line = rawLine.trim();
            if (!line) return;
            const pair = line.match(/^(github|url)\s*:\s*(.+)$/i);
            if (pair && currentId) {
                const key = pair[1].toLowerCase() === "github" ? "githubLink" : "demoLink";
                projects[currentId][key] = safeUrl(pair[2].trim());
                return;
            }
            currentId = line.replace(/:\s*$/, "").trim().toLowerCase().replace(/\s+/g, "-");
            projects[currentId] ||= {};
        });
        return projects;
    }

    function collectProjectAssets(paths) {
        const collected = {};
        paths.forEach(path => {
            const match = path.match(/^images\/projects\/([^/]+)\/(.+)$/i);
            if (!match || !SUPPORTED_EXTENSIONS.has(extensionOf(path))) return;
            (collected[match[1]] ||= []).push(path);
        });
        return collected;
    }

    function buildProjects(linkData, discoveredAssets) {
        const fallback = typeof projectAssetFallback === "object" ? projectAssetFallback : {};
        const metadata = typeof projectMetadata === "object" ? projectMetadata : {};
        const ids = [...new Set([...Object.keys(metadata), ...Object.keys(linkData), ...Object.keys(discoveredAssets)])];

        return ids.map(id => {
            const assets = (discoveredAssets[id] || fallback[id] || []).sort((a, b) => a.localeCompare(b));
            const meta = metadata[id] || {};
            return {
                id,
                title: meta.title || titleCase(id),
                description: meta.description || "A growing project. Visual documentation will be added as the work develops.",
                tags: meta.tags || ["Project"],
                githubLink: linkData[id]?.githubLink || "",
                demoLink: linkData[id]?.demoLink || "",
                images: assets.filter(path => IMAGE_EXTENSIONS.has(extensionOf(path))),
                videos: assets.filter(path => VIDEO_EXTENSIONS.has(extensionOf(path))),
                documents: assets.filter(path => DOCUMENT_EXTENSIONS.has(extensionOf(path)))
            };
        }).sort((a, b) => {
            const aHasMedia = a.images.length + a.videos.length + a.documents.length > 0;
            const bHasMedia = b.images.length + b.videos.length + b.documents.length > 0;
            return Number(bHasMedia) - Number(aHasMedia);
        });
    }

    function certificateCategory(path) {
        const value = path.toLowerCase();
        if (value.includes("dean") || value.includes("academic") || value.includes("diploma")) return "Academic";
        if (value.includes("music") || value.includes("rockschool")) return "Music";
        if (value.includes("kangaroo") || value.includes("competition") || value.includes("math-is-fun")) return "Competitions";
        if (/ai|prompt|data|google/.test(value)) return "AI & Data";
        if (/python|game|coding|minecraft|develop/.test(value)) return "Development";
        return "Other";
    }

    function issuerFor(path) {
        const value = path.toLowerCase();
        if (value.includes("google")) return "Google / Coursera";
        if (value.includes("dean")) return "UTeM";
        if (value.includes("rockschool")) return "Rockschool";
        if (value.includes("kangaroo")) return "Kangaroo Math Malaysia";
        if (/python|prompt/.test(value)) return "Online Learning";
        return certificateCategory(path);
    }

    function buildCertificates(paths) {
        return paths
            .filter(path => /^certificates\//i.test(path) && SUPPORTED_EXTENSIONS.has(extensionOf(path)))
            .map((path, index) => ({
                id: `certificate-${index}`,
                path,
                title: titleCase(path.split("/").pop()),
                type: extensionOf(path),
                category: certificateCategory(path),
                issuer: issuerFor(path)
            }))
            .sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
    }

    function mediaPlaceholder(project) {
        const initial = project.title.split(/\s+/).slice(0, 2).map(word => word[0]).join("");
        return `<div class="project-placeholder"><span>${escapeHtml(initial)}</span><p>Media coming soon</p></div>`;
    }

    function renderProjects() {
        const container = $("#projects-grid");
        const visible = state.projectsExpanded ? state.projects : state.projects.slice(0, MAX_COLLAPSED_PROJECTS);
        container.innerHTML = visible.map((project, index) => {
            const preview = project.images[0]
                ? `<img src="${fileUrl(project.images[0])}" alt="${escapeHtml(project.title)} preview" loading="lazy" width="720" height="440">`
                : project.videos[0]
                    ? `<video src="${fileUrl(project.videos[0])}#t=0.1" muted preload="metadata" aria-label="${escapeHtml(project.title)} video preview"></video>`
                    : mediaPlaceholder(project);
            const badges = [
                project.images.length && `${project.images.length} image${project.images.length === 1 ? "" : "s"}`,
                project.videos.length && `${project.videos.length} video${project.videos.length === 1 ? "" : "s"}`,
                project.documents.length && `${project.documents.length} PDF${project.documents.length === 1 ? "" : "s"}`
            ].filter(Boolean);
            return `
                <article class="project-card fade-in" data-project-id="${escapeHtml(project.id)}" tabindex="0" role="button" aria-label="Open ${escapeHtml(project.title)} details">
                    <div class="project-slideshow">
                        ${preview}
                        <div class="card-index">${String(index + 1).padStart(2, "0")}</div>
                        ${badges.length ? `<div class="card-badges-container">${badges.map(badge => `<span class="card-badge">${badge}</span>`).join("")}</div>` : ""}
                    </div>
                    <div class="project-info">
                        <div><h3>${escapeHtml(project.title)}</h3><p>${escapeHtml(project.description)}</p></div>
                        <div class="tech-tags">${project.tags.map(tag => `<span class="tech-tag">${escapeHtml(tag)}</span>`).join("")}</div>
                        <div class="project-card-footer"><span>Open project</span><span aria-hidden="true">↗</span></div>
                    </div>
                </article>`;
        }).join("");

        const showMore = $("#show-more-projects");
        if (showMore) {
            showMore.hidden = state.projects.length <= MAX_COLLAPSED_PROJECTS;
            showMore.textContent = state.projectsExpanded ? "Show fewer projects" : `Show all ${state.projects.length} projects`;
            showMore.setAttribute("aria-expanded", String(state.projectsExpanded));
        }

        $$('[data-project-id]', container).forEach(card => {
            const open = () => openProject(card.dataset.projectId);
            card.addEventListener("click", open);
            card.addEventListener("keydown", event => {
                if (["Enter", " "].includes(event.key)) { event.preventDefault(); open(); }
            });
        });
        initAnimations();
    }

    function renderCertificateFilters() {
        const categories = ["All", ...new Set(state.certificates.map(certificate => certificate.category))];
        $("#certificate-filters").innerHTML = categories.map(category => `
            <button class="filter-chip${category === state.certificateFilter ? " active" : ""}" data-certificate-filter="${escapeHtml(category)}">
                ${escapeHtml(category)} <span>${category === "All" ? state.certificates.length : state.certificates.filter(c => c.category === category).length}</span>
            </button>`).join("");
        $$('[data-certificate-filter]').forEach(button => button.addEventListener("click", () => {
            state.certificateFilter = button.dataset.certificateFilter;
            state.certificatesExpanded = state.certificateFilter !== "All";
            renderCertificateFilters();
            renderCertificates();
        }));
    }

    function certificatePreview(certificate) {
        const src = fileUrl(certificate.path);
        if (certificate.type === "pdf") {
            return `<div class="cert-preview-pdf"><object data="${src}#page=1&view=FitH" type="application/pdf" aria-label="Preview of ${escapeHtml(certificate.title)}"><span>PDF</span></object></div>`;
        }
        return `<div class="cert-preview-container"><img src="${src}" alt="${escapeHtml(certificate.title)}" loading="lazy" width="520" height="360"></div>`;
    }

    function renderCertificates() {
        const filtered = state.certificateFilter === "All"
            ? state.certificates
            : state.certificates.filter(certificate => certificate.category === state.certificateFilter);
        const visible = state.certificatesExpanded ? filtered : filtered.slice(0, MAX_COLLAPSED_CERTIFICATES);
        $("#certs-grid").innerHTML = visible.map(certificate => `
            <article class="cert-card fade-in" data-certificate-id="${certificate.id}" tabindex="0" role="button" aria-label="View ${escapeHtml(certificate.title)}">
                ${certificatePreview(certificate)}
                <div class="cert-info">
                    <span class="cert-category">${escapeHtml(certificate.category)}</span>
                    <h3 class="cert-title">${escapeHtml(certificate.title)}</h3>
                    <div class="cert-meta"><span>${escapeHtml(certificate.issuer)}</span><span>${certificate.type.toUpperCase()}</span></div>
                </div>
            </article>`).join("");
        const showMore = $("#show-more-certificates");
        showMore.hidden = filtered.length <= MAX_COLLAPSED_CERTIFICATES;
        showMore.textContent = state.certificatesExpanded ? "Show fewer certificates" : `Show all ${filtered.length} certificates`;
        showMore.setAttribute("aria-expanded", String(state.certificatesExpanded));
        $$('[data-certificate-id]').forEach(card => {
            const open = () => openCertificate(card.dataset.certificateId);
            card.addEventListener("click", open);
            card.addEventListener("keydown", event => {
                if (["Enter", " "].includes(event.key)) { event.preventDefault(); open(); }
            });
        });
        initAnimations();
    }

    function projectMedia(project) {
        const imageGallery = project.images.length ? `
            <div class="modal-main-img-wrapper"><img id="modal-main-img" src="${fileUrl(project.images[0])}" alt="${escapeHtml(project.title)}"></div>
            ${project.images.length > 1 ? `<div class="modal-gallery">${project.images.map((image, index) => `<button data-gallery-image="${fileUrl(image)}" aria-label="Show image ${index + 1}"><img src="${fileUrl(image)}" alt="" loading="lazy"></button>`).join("")}</div>` : ""}` : "";
        const videos = project.videos.map(video => `<video controls preload="metadata"><source src="${fileUrl(video)}"></video>`).join("");
        const documents = project.documents.map(document => `<div class="pdf-frame"><iframe src="${fileUrl(document)}#view=FitH" title="${escapeHtml(project.title)} PDF"></iframe><a href="${fileUrl(document)}" target="_blank">Open PDF in a new tab ↗</a></div>`).join("");
        return imageGallery + videos + documents || mediaPlaceholder(project);
    }

    function openProject(id) {
        const project = state.projects.find(item => item.id === id);
        if (!project) return;
        const actions = [
            project.demoLink && `<a class="btn btn-neon" href="${escapeHtml(project.demoLink)}" target="_blank" rel="noopener noreferrer">Live project ↗</a>`,
            project.githubLink && `<a class="btn btn-quiet" href="${escapeHtml(project.githubLink)}" target="_blank" rel="noopener noreferrer">Source code ↗</a>`
        ].filter(Boolean).join("");
        $("#project-modal-body").innerHTML = `
            <p class="eyebrow">Project details</p>
            <h2 id="project-modal-title">${escapeHtml(project.title)}</h2>
            <p class="modal-lead">${escapeHtml(project.description)}</p>
            <div class="tech-tags">${project.tags.map(tag => `<span class="tech-tag">${escapeHtml(tag)}</span>`).join("")}</div>
            ${actions ? `<div class="modal-action-btns">${actions}</div>` : ""}
            <div class="modal-media">${projectMedia(project)}</div>`;
        $$('[data-gallery-image]').forEach(button => button.addEventListener("click", () => {
            const mainImage = $("#modal-main-img");
            if (mainImage) mainImage.src = button.dataset.galleryImage;
        }));
        openModal("#project-modal");
    }

    function openCertificate(id) {
        const certificate = state.certificates.find(item => item.id === id);
        if (!certificate) return;
        const src = fileUrl(certificate.path);
        const viewer = certificate.type === "pdf"
            ? `<iframe class="cert-pdf-viewer" src="${src}#view=FitH" title="${escapeHtml(certificate.title)}"></iframe>`
            : `<img class="cert-modal-img" src="${src}" alt="${escapeHtml(certificate.title)}">`;
        $("#cert-modal-body").innerHTML = `
            <p class="eyebrow">${escapeHtml(certificate.category)}</p>
            <h2 id="cert-modal-title">${escapeHtml(certificate.title)}</h2>
            ${viewer}
            <a class="btn btn-neon" href="${src}" target="_blank">Open original ${certificate.type.toUpperCase()} ↗</a>`;
        openModal("#cert-modal");
    }

    function openModal(selector) {
        const modal = $(selector);
        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
        $("[data-close-modal]", modal)?.focus();
    }

    function closeModal(modal) {
        if (!modal) return;
        $$('video', modal).forEach(video => video.pause());
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
    }

    function initModalEvents() {
        $$(".project-modal-overlay, .cert-modal-overlay").forEach(modal => {
            modal.addEventListener("click", event => {
                if (event.target === modal || event.target.closest("[data-close-modal]")) closeModal(modal);
            });
        });
        document.addEventListener("keydown", event => {
            if (event.key === "Escape") $$(".active.project-modal-overlay, .active.cert-modal-overlay").forEach(closeModal);
        });
    }

    let animationObserver;
    function initAnimations() {
        if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
            $$(".fade-in").forEach(element => element.classList.add("visible"));
            return;
        }
        animationObserver ||= new IntersectionObserver(entries => entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                animationObserver.unobserve(entry.target);
            }
        }), { rootMargin: "80px 0px", threshold: 0.05 });
        $$(".fade-in:not(.visible)").forEach(element => animationObserver.observe(element));
    }

    function initNavigation() {
        const links = $$(".nav-link");
        const sections = $$("main section[id]");
        if (!("IntersectionObserver" in window)) return;
        const observer = new IntersectionObserver(entries => entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            links.forEach(link => link.classList.toggle("active", link.hash === `#${entry.target.id}`));
        }), { rootMargin: "-25% 0px -65%", threshold: 0 });
        sections.forEach(section => observer.observe(section));
    }

    function generateResumeHtml() {
        const liveDomain = "https://alicia-goh-portfolio.vercel.app";
        const currentUrl = (window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1") || !window.location.origin)
            ? liveDomain
            : window.location.origin + window.location.pathname;

        const projectItemsHtml = state.projects.map(p => `
            <li style="margin-bottom: 5px;">
                <strong>${escapeHtml(p.title)}:</strong> ${escapeHtml(p.description)} 
                (<a href="${currentUrl}#projects" style="color: #0055bb; text-decoration: underline;">View in Interactive Portfolio</a>)
            </li>
        `).join("");

        return `
            <div id="resume-document" style="font-family: Arial, Helvetica, sans-serif; color: #111111; background: #ffffff; padding: 32px 36px; line-height: 1.45; font-size: 12px;">
                <!-- HEADER -->
                <div style="border-bottom: 1.5px solid #222222; padding-bottom: 10px; margin-bottom: 14px;">
                    <h1 style="margin: 0 0 5px 0; font-size: 23px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #000000; font-family: Arial, sans-serif;">ALICIA GOH TING TING</h1>
                    <p style="margin: 0 0 4px 0; font-size: 11.5px; color: #333333;">
                        Melaka, Malaysia &nbsp;|&nbsp; +60 11-1059 6271 &nbsp;|&nbsp; aliciagoh0704@gmail.com
                    </p>
                    <p style="margin: 0; font-size: 11.5px; color: #333333;">
                        LinkedIn: <a href="https://linkedin.com/in/alitg" style="color: #0055bb; text-decoration: underline;">linkedin.com/in/alitg</a> &nbsp;|&nbsp; 
                        GitHub: <a href="https://github.com/EF361" style="color: #0055bb; text-decoration: underline;">github.com/EF361</a> &nbsp;|&nbsp; 
                        Portfolio: <a href="${currentUrl}" style="color: #0055bb; text-decoration: underline; font-weight: bold;">Interactive Portfolio Website</a>
                    </p>
                </div>

                <!-- SUMMARY -->
                <div style="margin-bottom: 14px;">
                    <h2 style="margin: 0 0 5px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #dddddd; padding-bottom: 2px; letter-spacing: 0.5px; color: #111111;">SUMMARY</h2>
                    <p style="margin: 0; font-size: 11.5px; color: #222222; text-align: justify; line-height: 1.48;">
                        AI Automation Engineer and Computer Science undergraduate specializing in Artificial Intelligence. Expert in developing secure, local-first Python applications, building industrial-grade RAG systems, and designing n8n automation workflows. Proven ability to lead end-to-end technical projects and manage client solutions while maintaining a 3.66 CGPA. Seeking an Industrial Trainee position (Oct 2026) to apply advanced Python, Machine Learning, and Process Automation skills.
                    </p>
                </div>

                <!-- EDUCATION -->
                <div style="margin-bottom: 14px;">
                    <h2 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #dddddd; padding-bottom: 2px; letter-spacing: 0.5px; color: #111111;">EDUCATION</h2>
                    
                    <div style="margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: baseline;">
                            <strong style="font-size: 12px; color: #000000;">Universiti Teknikal Malaysia Melaka (UTeM)</strong>
                            <span style="font-size: 11px; color: #555555;">Mar 2025 – Feb 2027</span>
                        </div>
                        <div style="font-size: 11.5px; color: #333333;">Bachelor of Computer Science (Artificial Intelligence) with Honours</div>
                        <ul style="margin: 2px 0 0 16px; padding: 0; font-size: 11px; color: #333333;">
                            <li>CGPA: 3.66 / 4.00</li>
                            <li>Core Coursework: Machine Learning, Natural Language Processing, Image Processing and Recognition, Neural Networks, Evolutionary Computing.</li>
                        </ul>
                    </div>

                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: baseline;">
                            <strong style="font-size: 12px; color: #000000;">Universiti Teknikal Malaysia Melaka (UTeM)</strong>
                            <span style="font-size: 11px; color: #555555;">Aug 2022 – Feb 2025</span>
                        </div>
                        <div style="font-size: 11.5px; color: #333333;">Diploma in Computer Science</div>
                        <ul style="margin: 2px 0 0 16px; padding: 0; font-size: 11px; color: #333333;">
                            <li>Awards: Dean's Award Recipient, Program Director Recognition Award.</li>
                        </ul>
                    </div>
                </div>

                <!-- TECHNICAL SKILLS -->
                <div style="margin-bottom: 14px;">
                    <h2 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #dddddd; padding-bottom: 2px; letter-spacing: 0.5px; color: #111111;">TECHNICAL SKILLS</h2>
                    <ul style="margin: 0 0 0 16px; padding: 0; font-size: 11px; color: #333333; line-height: 1.5;">
                        <li><strong>Programming:</strong> Python, SQL, JavaScript</li>
                        <li><strong>AI &amp; Data Science:</strong> Retrieval-Augmented Generation (RAG), Machine Learning, Generative AI, Natural Language Processing (NLP), Vector Databases</li>
                        <li><strong>Automation &amp; Tools:</strong> n8n Workflows, Streamlit, PyPDF, Pandas, Pygame, Micropython, Git</li>
                    </ul>
                </div>

                <!-- PROFESSIONAL EXPERIENCE -->
                <div style="margin-bottom: 14px;">
                    <h2 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #dddddd; padding-bottom: 2px; letter-spacing: 0.5px; color: #111111;">PROFESSIONAL EXPERIENCE</h2>
                    
                    <div style="margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: baseline;">
                            <strong style="font-size: 12px; color: #000000;">Meta AI Sdn Bhd | Malacca, Malaysia</strong>
                            <span style="font-size: 11px; color: #555555;">July 2024 – Present</span>
                        </div>
                        <div style="font-size: 11.5px; color: #333333; font-style: italic;">AI Developer / Internship Trainee</div>
                        <ul style="margin: 2px 0 0 16px; padding: 0; font-size: 11px; color: #333333; line-height: 1.45;">
                            <li>Built AI call center workflows and developed automated n8n pipelines to reduce manual administrative tasks.</li>
                            <li>Developed an AI-powered WhatsApp chatbot for JJ Deco Plus Sdn Bhd to improve customer interaction and response times.</li>
                            <li>Designed AI influencer systems for social platforms and applied NLP for effective query handling.</li>
                            <li>Conducted rigorous testing and debugging to ensure chatbot reliability before deployment.</li>
                        </ul>
                    </div>

                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: baseline;">
                            <strong style="font-size: 12px; color: #000000;">Xiao Wan Zi Swimming Centre | Melaka, Malaysia</strong>
                            <span style="font-size: 11px; color: #555555;">June 2025 – Present</span>
                        </div>
                        <div style="font-size: 11.5px; color: #333333; font-style: italic;">Assistant Swim Coach</div>
                        <ul style="margin: 2px 0 0 16px; padding: 0; font-size: 11px; color: #333333; line-height: 1.45;">
                            <li>Managed assigned student rosters, taking direct responsibility for teaching and scheduling.</li>
                            <li>Applied performance analysis to customize training plans, ensuring consistent technique improvement.</li>
                        </ul>
                    </div>
                </div>

                <!-- KEY TECHNICAL PROJECTS -->
                <div>
                    <h2 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #dddddd; padding-bottom: 2px; letter-spacing: 0.5px; color: #111111;">KEY TECHNICAL PROJECTS</h2>
                    <ul style="margin: 0 0 0 16px; padding: 0; font-size: 11px; color: #333333; line-height: 1.5;">
                        ${projectItemsHtml}
                    </ul>
                    <p style="margin: 10px 0 0 0; font-size: 10.5px; color: #666666; font-style: italic;">
                        * To explore full media assets, video demos, and project posters, visit the <a href="${currentUrl}" style="color: #0055bb; text-decoration: underline;">Interactive Portfolio Website</a>.
                    </p>
                </div>
            </div>
        `;
    }

    function initResumeEvents() {
        const btn = $("#view-resume-btn");
        if (!btn) return;

        btn.addEventListener("click", async event => {
            event.preventDefault();
            const originalText = btn.innerHTML;
            btn.innerHTML = "Building résumé PDF…";
            btn.style.pointerEvents = "none";

            const container = document.createElement("div");
            container.style.position = "absolute";
            container.style.left = "-9999px";
            container.style.top = "-9999px";
            container.innerHTML = generateResumeHtml();
            document.body.appendChild(container);

            const options = {
                margin: [0.35, 0.4, 0.35, 0.4],
                filename: "Alicia_Goh_Resume.pdf",
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: "in", format: "letter", orientation: "portrait" }
            };

            try {
                if (typeof html2pdf === "function") {
                    await html2pdf().set(options).from(container.firstElementChild).save();
                } else {
                    window.open("references/%5BResume%5D%2004062026.pdf", "_blank");
                }
            } catch {
                window.open("references/%5BResume%5D%2004062026.pdf", "_blank");
            } finally {
                btn.innerHTML = originalText;
                btn.style.pointerEvents = "auto";
                container.remove();
            }
        });
    }

    function initFooter() {
        const backToTopBtn = $("#back-to-top");
        if (backToTopBtn) {
            backToTopBtn.addEventListener("click", () => {
                window.scrollTo({ top: 0, behavior: "smooth" });
            });
        }

        const timeElement = $("#footer-time");
        if (timeElement) {
            const updateTime = () => {
                try {
                    const now = new Date();
                    const formatted = new Intl.DateTimeFormat("en-US", {
                        timeZone: "Asia/Kuala_Lumpur",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true
                    }).format(now);
                    timeElement.textContent = `${formatted} GMT+8`;
                } catch {
                    timeElement.textContent = "Melaka, MY (GMT+8)";
                }
            };
            updateTime();
            setInterval(updateTime, 30000);
        }
    }

    async function initialize() {
        $("#year").textContent = new Date().getFullYear();
        initModalEvents();
        initAnimations();
        initNavigation();
        initResumeEvents();
        initFooter();
        $("#show-more-certificates").addEventListener("click", () => {
            state.certificatesExpanded = !state.certificatesExpanded;
            renderCertificates();
        });
        $("#show-more-projects")?.addEventListener("click", () => {
            state.projectsExpanded = !state.projectsExpanded;
            renderProjects();
        });

        let firestoreProjects = [];
        if (window.FirebaseService && typeof window.FirebaseService.getProjects === "function") {
            try {
                firestoreProjects = await window.FirebaseService.getProjects();
            } catch (e) {
                console.warn("Firestore fetch fallback:", e);
            }
        }

        if (firestoreProjects && firestoreProjects.length > 0) {
            state.projects = firestoreProjects.map(p => ({
                id: p.id,
                title: p.title || p.id,
                description: p.description || "",
                tags: p.tags || ["Project"],
                githubLink: p.githubLink || "",
                demoLink: p.demoLink || "",
                images: p.images || [],
                videos: p.videos || [],
                documents: p.documents || []
            }));
        } else {
            const [linkData, paths] = await Promise.all([
                readProjectLinks(),
                discoverRepositoryFiles().catch(() => null)
            ]);
            const localFallbackPaths = [
                ...Object.values(typeof projectAssetFallback === "object" ? projectAssetFallback : {}).flat(),
                ...(typeof certificateAssetFallback === "object" ? certificateAssetFallback : [])
            ];
            const isLocalPreview = ["", "localhost", "127.0.0.1"].includes(window.location.hostname);
            const repositoryPaths = isLocalPreview ? localFallbackPaths : (paths || localFallbackPaths);
            state.projects = buildProjects(linkData, collectProjectAssets(repositoryPaths));
        }

        const [_, pathsForCerts] = await Promise.all([
            Promise.resolve(),
            discoverRepositoryFiles().catch(() => null)
        ]);
        const certFallbackPaths = [
            ...(typeof certificateAssetFallback === "object" ? certificateAssetFallback : [])
        ];
        state.certificates = buildCertificates(pathsForCerts || certFallbackPaths);

        renderProjects();
        renderCertificateFilters();
        renderCertificates();
    }

    initialize();
})();
