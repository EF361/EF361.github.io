(() => {
    "use strict";

    const state = {
        posts: [],
        filteredPosts: [],
        activeCategory: "All",
        searchQuery: "",
        currentPostId: null
    };

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

    const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[character]);

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

        const yearEl = $("#year");
        if (yearEl) {
            yearEl.textContent = new Date().getFullYear();
        }
    }

    async function loadPosts() {
        let firestorePosts = [];
        if (window.FirebaseService && typeof window.FirebaseService.getBlogPosts === "function") {
            try {
                firestorePosts = await window.FirebaseService.getBlogPosts();
            } catch (err) {
                console.warn("Firestore posts fetch fallback:", err);
            }
        }

        if (firestorePosts && firestorePosts.length > 0) {
            state.posts = firestorePosts;
            state.filteredPosts = firestorePosts;
            return;
        }

        // Load base posts from posts.js
        let posts = Array.isArray(window.blogPosts) ? [...window.blogPosts] : [];

        // Check if there are user-created posts saved in localStorage
        try {
            const localSaved = JSON.parse(localStorage.getItem("alicia_custom_blog_posts") || "[]");
            if (Array.isArray(localSaved) && localSaved.length > 0) {
                // Merge, avoiding duplicates by id
                const existingIds = new Set(posts.map(p => p.id));
                const newLocal = localSaved.filter(p => !existingIds.has(p.id));
                posts = [...newLocal, ...posts];
            }
        } catch (e) {
            console.warn("Could not read local draft posts", e);
        }

        state.posts = posts;
        state.filteredPosts = posts;
    }

    function renderFilters() {
        const filterContainer = $("#category-filters");
        if (!filterContainer) return;

        // Collect unique categories / tags
        const allTags = new Set();
        state.posts.forEach(post => {
            (post.tags || []).forEach(tag => allTags.add(tag));
        });

        const categories = ["All", ...Array.from(allTags).slice(0, 6)];

        filterContainer.innerHTML = categories.map(cat => {
            const isActive = cat === state.activeCategory;
            const count = cat === "All"
                ? state.posts.length
                : state.posts.filter(p => (p.tags || []).includes(cat)).length;
            return `
                <button class="filter-chip${isActive ? " active" : ""}" data-category="${escapeHtml(cat)}">
                    ${escapeHtml(cat)} <span>${count}</span>
                </button>
            `;
        }).join("");

        $$("[data-category]", filterContainer).forEach(btn => {
            btn.addEventListener("click", () => {
                state.activeCategory = btn.dataset.category;
                applyFilters();
                renderFilters();
            });
        });
    }

    function applyFilters() {
        let results = [...state.posts];

        if (state.activeCategory !== "All") {
            results = results.filter(p => (p.tags || []).includes(state.activeCategory));
        }

        if (state.searchQuery.trim()) {
            const query = state.searchQuery.toLowerCase().trim();
            results = results.filter(p => {
                const titleMatch = (p.title || "").toLowerCase().includes(query);
                const excerptMatch = (p.excerpt || "").toLowerCase().includes(query);
                const tagMatch = (p.tags || []).some(t => t.toLowerCase().includes(query));
                const appMatch = (p.appTitle || "").toLowerCase().includes(query);
                return titleMatch || excerptMatch || tagMatch || appMatch;
            });
        }

        state.filteredPosts = results;
        renderBlogList();
    }

    function renderBlogList() {
        const grid = $("#blog-grid");
        const emptyState = $("#blog-empty");
        if (!grid) return;

        if (state.filteredPosts.length === 0) {
            grid.innerHTML = "";
            if (emptyState) emptyState.hidden = false;
            return;
        }

        if (emptyState) emptyState.hidden = true;

        grid.innerHTML = state.filteredPosts.map(post => {
            const coverImage = post.coverImage
                ? `<div class="blog-card-media"><img src="${escapeHtml(post.coverImage)}" alt="${escapeHtml(post.title)}" loading="lazy"></div>`
                : `<div class="blog-card-placeholder"><span>${escapeHtml((post.title || "Blog").slice(0, 2).toUpperCase())}</span></div>`;

            const tagsHtml = (post.tags || []).map(t => `<span class="tech-tag">${escapeHtml(t)}</span>`).join("");

            return `
                <article class="blog-card fade-in" data-post-id="${escapeHtml(post.id)}" tabindex="0" role="button" aria-label="Read article: ${escapeHtml(post.title)}">
                    ${coverImage}
                    <div class="blog-card-content">
                        <div class="blog-card-meta">
                            <span class="blog-date">${escapeHtml(post.date || "")}</span>
                            <span class="blog-meta-dot">•</span>
                            <span class="blog-read-time">${escapeHtml(post.readTime || "4 min read")}</span>
                            ${post.appTitle ? `<span class="blog-app-badge">${escapeHtml(post.appTitle)}</span>` : ""}
                        </div>
                        <h2 class="blog-card-title">${escapeHtml(post.title)}</h2>
                        <p class="blog-card-excerpt">${escapeHtml(post.excerpt || "")}</p>
                        <div class="tech-tags">${tagsHtml}</div>
                        <div class="blog-card-footer">
                            <span>Read article</span>
                            <span aria-hidden="true">→</span>
                        </div>
                    </div>
                </article>
            `;
        }).join("");

        $$(".blog-card", grid).forEach(card => {
            const open = () => openPost(card.dataset.postId);
            card.addEventListener("click", open);
            card.addEventListener("keydown", event => {
                if (["Enter", " "].includes(event.key)) {
                    event.preventDefault();
                    open();
                }
            });
        });

        initScrollAnimations();
    }

    function openPost(postId, updateUrl = true) {
        const post = state.posts.find(p => p.id === postId);
        if (!post) return;

        state.currentPostId = postId;

        const listView = $("#blog-list-view");
        const articleView = $("#blog-article-view");
        const articleContainer = $("#article-content");

        if (listView) listView.hidden = true;
        if (articleView) articleView.hidden = false;
        if (articleContainer) articleContainer.classList.add("visible");

        window.scrollTo({ top: 0, behavior: "smooth" });

        if (updateUrl) {
            history.pushState({ postId }, post.title, `#${postId}`);
        }

        // Build links bar
        let appLinksHtml = "";
        if (post.appUrl || post.githubUrl || post.appId) {
            appLinksHtml = `
                <div class="article-app-box">
                    <div class="article-app-details">
                        <span class="article-app-eyebrow">Featured Application</span>
                        <h3 class="article-app-name">${escapeHtml(post.appTitle || "Project App")}</h3>
                    </div>
                    <div class="article-app-actions">
                        ${post.appUrl ? `<a href="${escapeHtml(post.appUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-neon btn-sm">Launch App ↗</a>` : ""}
                        ${post.githubUrl ? `<a href="${escapeHtml(post.githubUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-quiet btn-sm">GitHub Repo ↗</a>` : ""}
                        <a href="index.html#projects" class="btn btn-quiet btn-sm">View in Portfolio ↘</a>
                    </div>
                </div>
            `;
        }

        const tagsHtml = (post.tags || []).map(t => `<span class="tech-tag">${escapeHtml(t)}</span>`).join("");

        articleContainer.innerHTML = `
            <header class="article-header">
                <button id="back-to-list-btn" class="article-back-btn" aria-label="Back to all articles">
                    ← Back to all posts
                </button>
                <div class="article-meta-header">
                    <span class="article-date">${escapeHtml(post.date || "")}</span>
                    <span class="blog-meta-dot">•</span>
                    <span class="article-read-time">${escapeHtml(post.readTime || "5 min read")}</span>
                    <span class="blog-meta-dot">•</span>
                    <span class="article-author">By Alicia Goh</span>
                </div>
                <h1 class="article-title">${escapeHtml(post.title)}</h1>
                <p class="article-lead">${escapeHtml(post.excerpt || "")}</p>
                <div class="tech-tags">${tagsHtml}</div>
            </header>

            ${post.coverImage ? `
                <div class="article-featured-image">
                    <img src="${escapeHtml(post.coverImage)}" alt="${escapeHtml(post.title)} banner">
                </div>
            ` : ""}

            ${appLinksHtml}

            <div class="article-body">
                ${post.content || "<p>Article content coming soon.</p>"}
            </div>

            <footer class="article-footer">
                <div class="article-footer-author">
                    <img src="images/alicia-goh-headshot.png" alt="Alicia Goh portrait" class="author-avatar">
                    <div>
                        <strong>Alicia Goh Ting Ting</strong>
                        <p>AI & Automation Developer building intelligent workflows and thoughtful Python products.</p>
                    </div>
                </div>
                <div class="article-footer-nav">
                    <button id="article-bottom-back-btn" class="btn btn-quiet">← Back to all posts</button>
                    <a href="index.html#contact" class="btn btn-neon">Get in touch ↗</a>
                </div>
            </footer>
        `;

        const backHandler = () => closeArticle();
        $("#back-to-list-btn")?.addEventListener("click", backHandler);
        $("#article-bottom-back-btn")?.addEventListener("click", backHandler);
    }

    function closeArticle(updateUrl = true) {
        state.currentPostId = null;
        const listView = $("#blog-list-view");
        const articleView = $("#blog-article-view");

        if (articleView) articleView.hidden = true;
        if (listView) listView.hidden = false;

        if (updateUrl) {
            history.pushState({}, document.title, window.location.pathname);
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function initNewPostModal() {
        const openBtn = $("#open-new-post-modal");
        const modal = $("#new-post-modal");
        const closeBtn = $("#close-new-post-modal");
        const form = $("#new-post-form");
        const copyBtn = $("#copy-post-code-btn");
        const saveLocalBtn = $("#save-post-local-btn");
        const codeOutput = $("#generated-post-code");
        const noticeEl = $("#copy-success-notice");

        if (!modal) return;

        const open = () => {
            modal.classList.add("active");
            document.body.classList.add("modal-open");
        };

        const close = () => {
            modal.classList.remove("active");
            document.body.classList.remove("modal-open");
        };

        openBtn?.addEventListener("click", open);
        closeBtn?.addEventListener("click", close);

        modal.addEventListener("click", e => {
            if (e.target === modal) close();
        });

        window.addEventListener("keydown", e => {
            if (e.key === "Escape" && modal.classList.contains("active")) {
                close();
            }
        });

        function generatePostObject() {
            const title = $("#post-title").value.trim() || "My New App Post";
            const slug = $("#post-slug").value.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            const appTitle = $("#post-app-title").value.trim() || "";
            const appUrl = $("#post-app-url").value.trim() || "";
            const githubUrl = $("#post-github-url").value.trim() || "";
            const coverImage = $("#post-cover-image").value.trim() || "";
            const readTime = $("#post-read-time").value.trim() || "4 min read";
            const date = $("#post-date").value.trim() || new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(new Date());
            const tags = $("#post-tags").value.split(",").map(t => t.trim()).filter(Boolean);
            const excerpt = $("#post-excerpt").value.trim() || "";
            const rawContent = $("#post-content-body").value.trim();

            // Format content into HTML paragraphs if raw text was pasted
            let formattedContent = rawContent;
            if (!rawContent.includes("<p>") && !rawContent.includes("<h2>")) {
                formattedContent = rawContent
                    .split(/\n\n+/)
                    .map(para => {
                        const trimmed = para.trim();
                        if (trimmed.startsWith("## ")) {
                            return `<h2>${escapeHtml(trimmed.replace(/^##\s*/, ""))}</h2>`;
                        }
                        return `<p>${escapeHtml(trimmed)}</p>`;
                    })
                    .join("\n      ");
            }

            return {
                id: slug,
                title,
                date,
                readTime,
                appTitle,
                appUrl,
                githubUrl,
                coverImage,
                tags: tags.length ? tags : ["Python", "AI"],
                excerpt,
                content: formattedContent
            };
        }

        form?.addEventListener("input", () => {
            const postObj = generatePostObject();
            const formattedString = JSON.stringify(postObj, null, 2);
            if (codeOutput) {
                codeOutput.textContent = formattedString;
            }
        });

        copyBtn?.addEventListener("click", () => {
            const postObj = generatePostObject();
            const jsCode = `  {\n    id: "${postObj.id}",\n    title: "${postObj.title.replace(/"/g, '\\"')}",\n    date: "${postObj.date}",\n    readTime: "${postObj.readTime}",\n    appTitle: "${postObj.appTitle.replace(/"/g, '\\"')}",\n    appUrl: "${postObj.appUrl}",\n    githubUrl: "${postObj.githubUrl}",\n    coverImage: "${postObj.coverImage}",\n    tags: ${JSON.stringify(postObj.tags)},\n    excerpt: "${postObj.excerpt.replace(/"/g, '\\"')}",\n    content: \`\n      ${postObj.content}\n    \`\n  },`;

            navigator.clipboard.writeText(jsCode).then(() => {
                if (noticeEl) {
                    noticeEl.textContent = "✓ Post code copied to clipboard! Paste it into posts.js";
                    noticeEl.style.display = "block";
                    setTimeout(() => { noticeEl.style.display = "none"; }, 5000);
                }
            }).catch(() => {
                alert("Copied code! Check the preview box.");
            });
        });

        saveLocalBtn?.addEventListener("click", () => {
            const postObj = generatePostObject();
            try {
                const localSaved = JSON.parse(localStorage.getItem("alicia_custom_blog_posts") || "[]");
                const filtered = localSaved.filter(p => p.id !== postObj.id);
                filtered.unshift(postObj);
                localStorage.setItem("alicia_custom_blog_posts", JSON.stringify(filtered));

                // Reload posts and re-render
                loadPosts();
                applyFilters();
                renderFilters();
                close();

                if (noticeEl) {
                    noticeEl.textContent = "✓ Post added to your active blog list!";
                    noticeEl.style.display = "block";
                }
                openPost(postObj.id);
            } catch (err) {
                console.error("Failed to save draft locally", err);
            }
        });
    }

    function initRouting() {
        const checkHash = () => {
            const hash = window.location.hash.replace(/^#/, "");
            const params = new URLSearchParams(window.location.search);
            const postId = params.get("post") || hash;

            if (postId && state.posts.some(p => p.id === postId)) {
                openPost(postId, false);
            } else if (!postId && state.currentPostId) {
                closeArticle(false);
            }
        };

        window.addEventListener("popstate", checkHash);
        checkHash();
    }

    function initScrollAnimations() {
        if (!("IntersectionObserver" in window)) {
            $$(".fade-in").forEach(el => el.classList.add("visible"));
            return;
        }

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    obs.unobserve(entry.target);
                }
            });
        }, { rootMargin: "60px 0px", threshold: 0.05 });

        $$(".fade-in:not(.visible)").forEach(el => observer.observe(el));
    }

    function initSearch() {
        const searchInput = $("#blog-search");
        if (!searchInput) return;

        searchInput.addEventListener("input", e => {
            state.searchQuery = e.target.value;
            applyFilters();
        });
    }

    async function initialize() {
        initFooter();
        await loadPosts();
        renderFilters();
        renderBlogList();
        initSearch();
        initNewPostModal();
        initRouting();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize);
    } else {
        initialize();
    }
})();
