/**
 * ============================================================================
 * ADMIN CMS CONTROLLER (admin.js)
 * Alicia Goh Portfolio & Blog CMS
 * ============================================================================
 */
(() => {
    "use strict";

    const state = {
        currentUser: null,
        activeTab: "projects",
        projects: [],
        posts: [],
        currentProjectMedia: {
            images: [],
            videos: [],
            documents: []
        }
    };

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

    const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[character]);

    function initAuth() {
        const loginSection = $("#login-section");
        const dashboardSection = $("#dashboard-section");
        const logoutBtn = $("#admin-logout-btn");
        const googleLoginBtn = $("#google-login-btn");
        const loginErrorMsg = $("#login-error-msg");
        const adminUserName = $("#admin-user-name");

        if (!window.FirebaseService) {
            console.error("FirebaseService not found");
            return;
        }

        window.FirebaseService.onAuthStateChanged(user => {
            state.currentUser = user;
            if (user) {
                if (loginSection) loginSection.style.display = "none";
                if (dashboardSection) dashboardSection.style.display = "block";
                if (logoutBtn) logoutBtn.style.display = "inline-flex";
                if (adminUserName) adminUserName.textContent = user.displayName ? user.displayName.split(" ")[0] : "Alicia";
                loadDashboardData();
            } else {
                if (dashboardSection) dashboardSection.style.display = "none";
                if (loginSection) loginSection.style.display = "flex";
                if (logoutBtn) logoutBtn.style.display = "none";
            }
        });

        googleLoginBtn?.addEventListener("click", async () => {
            if (loginErrorMsg) loginErrorMsg.style.display = "none";
            googleLoginBtn.disabled = true;
            googleLoginBtn.innerHTML = "Authenticating with Google…";

            try {
                await window.FirebaseService.signInWithGoogle();
            } catch (err) {
                if (loginErrorMsg) {
                    loginErrorMsg.textContent = err.message || "Failed to sign in. Please try again.";
                    loginErrorMsg.style.display = "block";
                }
            } finally {
                googleLoginBtn.disabled = false;
                googleLoginBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="18" height="18" style="margin-right: 6px;" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                    Sign in with Google
                `;
            }
        });

        logoutBtn?.addEventListener("click", async () => {
            await window.FirebaseService.signOut();
        });
    }

    function initTabs() {
        const tabs = $$(".admin-tab");
        tabs.forEach(tab => {
            tab.addEventListener("click", () => {
                tabs.forEach(t => {
                    t.classList.remove("active");
                    t.setAttribute("aria-selected", "false");
                });
                tab.classList.add("active");
                tab.setAttribute("aria-selected", "true");

                const target = tab.dataset.tab;
                state.activeTab = target;

                $$(".admin-tab-content").forEach(content => {
                    content.style.display = content.id === `tab-content-${target}` ? "block" : "none";
                });
            });
        });
    }

    async function loadDashboardData() {
        await Promise.all([loadProjects(), loadBlogPosts()]);
    }

    // --- PROJECTS MANAGEMENT ---
    async function loadProjects() {
        const listEl = $("#projects-admin-list");
        const countEl = $("#count-projects");
        if (!listEl) return;

        listEl.innerHTML = `<div class="loading-card">Fetching projects from Firestore…</div>`;

        try {
            state.projects = await window.FirebaseService.getProjects();
            if (countEl) countEl.textContent = state.projects.length;

            renderProjectsList();
        } catch (err) {
            listEl.innerHTML = `<div class="admin-alert error">Error loading projects: ${escapeHtml(err.message)}</div>`;
        }
    }

    function renderProjectsList(filteredList = null) {
        const listEl = $("#projects-admin-list");
        if (!listEl) return;

        const items = filteredList || state.projects;

        if (items.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state-card">
                    <h3>No projects found in Firestore</h3>
                    <p>Click "+ Add Project" to create your first project, or go to "Database & Sync" to seed your 10 existing portfolio projects!</p>
                </div>
            `;
            return;
        }

        listEl.innerHTML = items.map(proj => {
            const firstImg = (proj.images && proj.images[0]) || (proj.videos && proj.videos[0]) || "";
            const mediaCount = (proj.images?.length || 0) + (proj.videos?.length || 0) + (proj.documents?.length || 0);

            const thumbHtml = firstImg && /\.(png|jpe?g|webp|gif)$/i.test(firstImg)
                ? `<img src="${escapeHtml(firstImg)}" alt="${escapeHtml(proj.title)}" class="admin-card-thumb">`
                : `<div class="admin-card-thumb-placeholder">${escapeHtml(proj.title.slice(0, 2).toUpperCase())}</div>`;

            const tagsHtml = (proj.tags || []).map(t => `<span class="tech-tag">${escapeHtml(t)}</span>`).join("");

            return `
                <div class="admin-data-card" data-id="${escapeHtml(proj.id)}">
                    <div class="admin-card-header">
                        ${thumbHtml}
                        <div class="admin-card-title-box">
                            <h3>${escapeHtml(proj.title)}</h3>
                            <span class="admin-card-slug">ID: <code>${escapeHtml(proj.id)}</code> • Order: ${proj.order || 1}</span>
                        </div>
                    </div>
                    <p class="admin-card-desc">${escapeHtml(proj.description || "")}</p>
                    <div class="tech-tags">${tagsHtml}</div>
                    <div class="admin-card-footer">
                        <span class="media-count-badge">📦 ${mediaCount} media asset${mediaCount === 1 ? "" : "s"}</span>
                        <div class="admin-card-actions">
                            <button class="btn btn-quiet btn-sm edit-proj-btn" data-id="${escapeHtml(proj.id)}">Edit</button>
                            <button class="btn btn-quiet btn-sm delete-proj-btn" data-id="${escapeHtml(proj.id)}" style="color: #ff5566;">Delete</button>
                        </div>
                    </div>
                </div>
            `;
        }).join("");

        $$(".edit-proj-btn", listEl).forEach(btn => {
            btn.addEventListener("click", () => openProjectModal(btn.dataset.id));
        });

        $$(".delete-proj-btn", listEl).forEach(btn => {
            btn.addEventListener("click", () => handleDeleteProject(btn.dataset.id));
        });
    }

    function initProjectEditor() {
        const modal = $("#project-modal");
        const closeBtn = $("#close-project-modal");
        const cancelBtn = $("#cancel-project-btn");
        const form = $("#project-form");
        const createBtn = $("#create-project-btn");
        const quickAddBtn = $("#quick-add-project-btn");
        const dropzone = $("#proj-dropzone");
        const fileInput = $("#proj-file-input");
        const addUrlBtn = $("#proj-add-url-btn");
        const urlInput = $("#proj-add-media-url");
        const searchInput = $("#project-search-input");

        const open = () => {
            modal.classList.add("active");
            document.body.classList.add("modal-open");
        };

        const close = () => {
            modal.classList.remove("active");
            document.body.classList.remove("modal-open");
        };

        createBtn?.addEventListener("click", () => openProjectModal());
        quickAddBtn?.addEventListener("click", () => openProjectModal());
        closeBtn?.addEventListener("click", close);
        cancelBtn?.addEventListener("click", close);

        modal?.addEventListener("click", e => {
            if (e.target === modal) close();
        });

        // Search projects
        searchInput?.addEventListener("input", e => {
            const query = e.target.value.toLowerCase().trim();
            if (!query) {
                renderProjectsList();
                return;
            }
            const filtered = state.projects.filter(p =>
                (p.title || "").toLowerCase().includes(query) ||
                (p.id || "").toLowerCase().includes(query) ||
                (p.tags || []).some(t => t.toLowerCase().includes(query))
            );
            renderProjectsList(filtered);
        });

        // Dropzone & File uploads
        dropzone?.addEventListener("click", () => fileInput?.click());

        dropzone?.addEventListener("dragover", e => {
            e.preventDefault();
            dropzone.classList.add("dragover");
        });

        dropzone?.addEventListener("dragleave", () => {
            dropzone.classList.remove("dragover");
        });

        dropzone?.addEventListener("drop", e => {
            e.preventDefault();
            dropzone.classList.remove("dragover");
            if (e.dataTransfer.files?.length) {
                handleMediaFiles(e.dataTransfer.files);
            }
        });

        fileInput?.addEventListener("change", e => {
            if (e.target.files?.length) {
                handleMediaFiles(e.target.files);
            }
        });

        // Add URL manually
        addUrlBtn?.addEventListener("click", () => {
            const url = urlInput.value.trim();
            if (!url) return;
            addMediaToProject(url);
            urlInput.value = "";
            renderProjectMediaGallery();
        });

        // Save project
        form?.addEventListener("submit", async () => {
            const isEdit = $("#edit-project-is-edit").value === "true";
            const id = $("#proj-id").value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
            const title = $("#proj-title").value.trim();
            const description = $("#proj-desc").value.trim();
            const tags = $("#proj-tags").value.split(",").map(t => t.trim()).filter(Boolean);
            const order = parseInt($("#proj-order").value) || 1;
            const demoLink = $("#proj-demo-url").value.trim();
            const githubLink = $("#proj-github-url").value.trim();

            const saveBtn = $("#save-project-btn");
            saveBtn.disabled = true;
            saveBtn.textContent = "Saving to Firestore…";

            try {
                await window.FirebaseService.saveProject({
                    id,
                    title,
                    description,
                    tags,
                    order,
                    demoLink,
                    githubLink,
                    images: state.currentProjectMedia.images,
                    videos: state.currentProjectMedia.videos,
                    documents: state.currentProjectMedia.documents
                });

                close();
                await loadProjects();
            } catch (err) {
                alert("Error saving project: " + err.message);
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = "Save Project";
            }
        });
    }

    function openProjectModal(projectId = null) {
        const modal = $("#project-modal");
        const heading = $("#project-modal-heading");
        const isEditInput = $("#edit-project-is-edit");
        const idInput = $("#proj-id");
        const titleInput = $("#proj-title");
        const descInput = $("#proj-desc");
        const tagsInput = $("#proj-tags");
        const orderInput = $("#proj-order");
        const demoInput = $("#proj-demo-url");
        const githubInput = $("#proj-github-url");

        if (projectId) {
            const proj = state.projects.find(p => p.id === projectId);
            if (!proj) return;

            heading.textContent = "Edit Project: " + proj.title;
            isEditInput.value = "true";
            idInput.value = proj.id;
            idInput.disabled = true; // Don't change ID of existing document
            titleInput.value = proj.title || "";
            descInput.value = proj.description || "";
            tagsInput.value = (proj.tags || []).join(", ");
            orderInput.value = proj.order || 1;
            demoInput.value = proj.demoLink || "";
            githubInput.value = proj.githubLink || "";

            state.currentProjectMedia = {
                images: [...(proj.images || [])],
                videos: [...(proj.videos || [])],
                documents: [...(proj.documents || [])]
            };
        } else {
            heading.textContent = "Add New Project";
            isEditInput.value = "false";
            idInput.value = "";
            idInput.disabled = false;
            titleInput.value = "";
            descInput.value = "";
            tagsInput.value = "";
            orderInput.value = (state.projects.length + 1).toString();
            demoInput.value = "";
            githubInput.value = "";

            state.currentProjectMedia = {
                images: [],
                videos: [],
                documents: []
            };
        }

        renderProjectMediaGallery();
        modal.classList.add("active");
        document.body.classList.add("modal-open");
    }

    function addMediaToProject(url) {
        const lower = url.toLowerCase();
        if (/\.(mp4|webm|mov)$/i.test(lower)) {
            state.currentProjectMedia.videos.push(url);
        } else if (/\.pdf$/i.test(lower)) {
            state.currentProjectMedia.documents.push(url);
        } else {
            state.currentProjectMedia.images.push(url);
        }
    }

    function removeMediaFromProject(url) {
        state.currentProjectMedia.images = state.currentProjectMedia.images.filter(u => u !== url);
        state.currentProjectMedia.videos = state.currentProjectMedia.videos.filter(u => u !== url);
        state.currentProjectMedia.documents = state.currentProjectMedia.documents.filter(u => u !== url);
        renderProjectMediaGallery();
    }

    function renderProjectMediaGallery() {
        const gallery = $("#proj-media-gallery");
        if (!gallery) return;

        const allMedia = [
            ...state.currentProjectMedia.images.map(url => ({ url, type: "image" })),
            ...state.currentProjectMedia.videos.map(url => ({ url, type: "video" })),
            ...state.currentProjectMedia.documents.map(url => ({ url, type: "pdf" }))
        ];

        if (allMedia.length === 0) {
            gallery.innerHTML = `<span class="help-text">No media added yet. Upload files or paste URLs above.</span>`;
            return;
        }

        gallery.innerHTML = allMedia.map(item => {
            const preview = item.type === "image"
                ? `<img src="${escapeHtml(item.url)}" alt="Media thumbnail">`
                : item.type === "video"
                    ? `<div class="media-type-badge">VIDEO</div>`
                    : `<div class="media-type-badge">PDF</div>`;

            return `
                <div class="media-thumb-item">
                    ${preview}
                    <button type="button" class="media-thumb-delete" data-url="${escapeHtml(item.url)}" aria-label="Remove media">×</button>
                    <span class="media-thumb-name">${escapeHtml(item.url.split("/").pop())}</span>
                </div>
            `;
        }).join("");

        $$(".media-thumb-delete", gallery).forEach(btn => {
            btn.addEventListener("click", () => removeMediaFromProject(btn.dataset.url));
        });
    }

    async function handleMediaFiles(fileList) {
        const progressContainer = $("#proj-upload-progress-container");
        const progressBar = $("#proj-upload-progress-bar");
        const progressText = $("#proj-upload-progress-text");
        const projId = $("#proj-id").value.trim() || "temp-project";

        if (progressContainer) progressContainer.style.display = "block";

        const files = Array.from(fileList);
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                if (progressText) progressText.textContent = `Uploading ${file.name} (${i + 1}/${files.length})…`;
                const result = await window.FirebaseService.uploadMediaFile(`projects/${projId}`, file, percent => {
                    if (progressBar) progressBar.style.width = percent + "%";
                });
                addMediaToProject(result.downloadUrl);
            } catch (err) {
                console.error("Storage upload failed:", err);
                alert(`Upload failed for ${file.name}: ${err.message}\nMake sure Firebase Storage is enabled in the Firebase Console.`);
            }
        }

        if (progressContainer) progressContainer.style.display = "none";
        renderProjectMediaGallery();
    }

    async function handleDeleteProject(projectId) {
        if (!confirm(`Are you sure you want to delete project "${projectId}" from Firestore?`)) return;
        try {
            await window.FirebaseService.deleteProject(projectId);
            await loadProjects();
        } catch (err) {
            alert("Error deleting project: " + err.message);
        }
    }

    // --- BLOG POSTS MANAGEMENT ---
    async function loadBlogPosts() {
        const listEl = $("#posts-admin-list");
        const countEl = $("#count-posts");
        if (!listEl) return;

        listEl.innerHTML = `<div class="loading-card">Fetching blog posts from Firestore…</div>`;

        try {
            state.posts = await window.FirebaseService.getBlogPosts();
            if (countEl) countEl.textContent = state.posts.length;

            renderPostsList();
        } catch (err) {
            listEl.innerHTML = `<div class="admin-alert error">Error loading blog posts: ${escapeHtml(err.message)}</div>`;
        }
    }

    function renderPostsList(filteredList = null) {
        const listEl = $("#posts-admin-list");
        if (!listEl) return;

        const items = filteredList || state.posts;

        if (items.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state-card">
                    <h3>No blog posts found in Firestore</h3>
                    <p>Click "+ Add Blog Post" to write an article, or go to "Database & Sync" to seed your 4 initial build log articles!</p>
                </div>
            `;
            return;
        }

        listEl.innerHTML = items.map(post => {
            const coverHtml = post.coverImage
                ? `<img src="${escapeHtml(post.coverImage)}" alt="${escapeHtml(post.title)}" class="admin-card-thumb">`
                : `<div class="admin-card-thumb-placeholder">POST</div>`;

            const tagsHtml = (post.tags || []).map(t => `<span class="tech-tag">${escapeHtml(t)}</span>`).join("");

            return `
                <div class="admin-data-card" data-id="${escapeHtml(post.id)}">
                    <div class="admin-card-header">
                        ${coverHtml}
                        <div class="admin-card-title-box">
                            <h3>${escapeHtml(post.title)}</h3>
                            <span class="admin-card-slug">Slug: <code>${escapeHtml(post.id)}</code> • ${escapeHtml(post.date || "")}</span>
                        </div>
                    </div>
                    <p class="admin-card-desc">${escapeHtml(post.excerpt || "")}</p>
                    <div class="tech-tags">${tagsHtml}</div>
                    <div class="admin-card-footer">
                        <span class="media-count-badge">📖 ${escapeHtml(post.readTime || "5 min read")}</span>
                        <div class="admin-card-actions">
                            <button class="btn btn-quiet btn-sm edit-post-btn" data-id="${escapeHtml(post.id)}">Edit</button>
                            <button class="btn btn-quiet btn-sm delete-post-btn" data-id="${escapeHtml(post.id)}" style="color: #ff5566;">Delete</button>
                        </div>
                    </div>
                </div>
            `;
        }).join("");

        $$(".edit-post-btn", listEl).forEach(btn => {
            btn.addEventListener("click", () => openPostModal(btn.dataset.id));
        });

        $$(".delete-post-btn", listEl).forEach(btn => {
            btn.addEventListener("click", () => handleDeletePost(btn.dataset.id));
        });
    }

    function initPostEditor() {
        const modal = $("#post-modal");
        const closeBtn = $("#close-post-modal");
        const cancelBtn = $("#cancel-post-btn");
        const form = $("#post-form");
        const createBtn = $("#create-post-btn");
        const quickAddBtn = $("#quick-add-post-btn");
        const searchInput = $("#post-search-input");

        const open = () => {
            modal.classList.add("active");
            document.body.classList.add("modal-open");
        };

        const close = () => {
            modal.classList.remove("active");
            document.body.classList.remove("modal-open");
        };

        createBtn?.addEventListener("click", () => openPostModal());
        quickAddBtn?.addEventListener("click", () => openPostModal());
        closeBtn?.addEventListener("click", close);
        cancelBtn?.addEventListener("click", close);

        modal?.addEventListener("click", e => {
            if (e.target === modal) close();
        });

        // Search posts
        searchInput?.addEventListener("input", e => {
            const query = e.target.value.toLowerCase().trim();
            if (!query) {
                renderPostsList();
                return;
            }
            const filtered = state.posts.filter(p =>
                (p.title || "").toLowerCase().includes(query) ||
                (p.id || "").toLowerCase().includes(query) ||
                (p.tags || []).some(t => t.toLowerCase().includes(query))
            );
            renderPostsList(filtered);
        });

        // Quick formatting tools in editor
        $$(".btn-tool").forEach(btn => {
            btn.addEventListener("click", () => {
                const textarea = $("#post-form-content");
                if (!textarea) return;
                const tool = btn.dataset.tool;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const selected = textarea.value.substring(start, end);

                let snippet = "";
                if (tool === "h2") snippet = `\n<h2>${selected || "Section Heading"}</h2>\n`;
                if (tool === "code") snippet = `\n<pre><code>${selected || "// Code snippet here"}</code></pre>\n`;
                if (tool === "ul") snippet = `\n<ul>\n  <li>${selected || "Item 1"}</li>\n  <li>Item 2</li>\n</ul>\n`;
                if (tool === "bold") snippet = `<strong>${selected || "bold text"}</strong>`;

                textarea.setRangeText(snippet, start, end, "end");
                textarea.focus();
            });
        });

        // Save post
        form?.addEventListener("submit", async () => {
            const id = $("#post-form-slug").value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
            const title = $("#post-form-title").value.trim();
            const appTitle = $("#post-form-app").value.trim();
            const date = $("#post-form-date").value.trim() || new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(new Date());
            const readTime = $("#post-form-readtime").value.trim() || "5 min read";
            const appUrl = $("#post-form-app-url").value.trim();
            const githubUrl = $("#post-form-github-url").value.trim();
            const coverImage = $("#post-form-cover").value.trim();
            const tags = $("#post-form-tags").value.split(",").map(t => t.trim()).filter(Boolean);
            const excerpt = $("#post-form-excerpt").value.trim();
            const content = $("#post-form-content").value.trim();

            const saveBtn = $("#save-post-btn");
            saveBtn.disabled = true;
            saveBtn.textContent = "Saving to Firestore…";

            try {
                await window.FirebaseService.saveBlogPost({
                    id,
                    title,
                    appTitle,
                    date,
                    readTime,
                    appUrl,
                    githubUrl,
                    coverImage,
                    tags,
                    excerpt,
                    content
                });

                close();
                await loadBlogPosts();
            } catch (err) {
                alert("Error saving blog post: " + err.message);
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = "Save Article";
            }
        });
    }

    function openPostModal(postId = null) {
        const modal = $("#post-modal");
        const heading = $("#post-modal-heading");
        const isEditInput = $("#edit-post-is-edit");
        const slugInput = $("#post-form-slug");
        const titleInput = $("#post-form-title");
        const appInput = $("#post-form-app");
        const dateInput = $("#post-form-date");
        const readTimeInput = $("#post-form-readtime");
        const appUrlInput = $("#post-form-app-url");
        const githubUrlInput = $("#post-form-github-url");
        const coverInput = $("#post-form-cover");
        const tagsInput = $("#post-form-tags");
        const excerptInput = $("#post-form-excerpt");
        const contentInput = $("#post-form-content");

        if (postId) {
            const post = state.posts.find(p => p.id === postId);
            if (!post) return;

            heading.textContent = "Edit Article: " + post.title;
            isEditInput.value = "true";
            slugInput.value = post.id;
            slugInput.disabled = true;
            titleInput.value = post.title || "";
            appInput.value = post.appTitle || "";
            dateInput.value = post.date || "";
            readTimeInput.value = post.readTime || "";
            appUrlInput.value = post.appUrl || "";
            githubUrlInput.value = post.githubUrl || "";
            coverInput.value = post.coverImage || "";
            tagsInput.value = (post.tags || []).join(", ");
            excerptInput.value = post.excerpt || "";
            contentInput.value = post.content || "";
        } else {
            heading.textContent = "Add New Blog Post";
            isEditInput.value = "false";
            slugInput.value = "";
            slugInput.disabled = false;
            titleInput.value = "";
            appInput.value = "";
            dateInput.value = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(new Date());
            readTimeInput.value = "4 min read";
            appUrlInput.value = "";
            githubUrlInput.value = "";
            coverInput.value = "";
            tagsInput.value = "";
            excerptInput.value = "";
            contentInput.value = "";
        }

        modal.classList.add("active");
        document.body.classList.add("modal-open");
    }

    async function handleDeletePost(postId) {
        if (!confirm(`Are you sure you want to delete article "${postId}" from Firestore?`)) return;
        try {
            await window.FirebaseService.deleteBlogPost(postId);
            await loadBlogPosts();
        } catch (err) {
            alert("Error deleting article: " + err.message);
        }
    }

    // --- ONE-CLICK SEEDING ---
    function initSyncTools() {
        const seedBtn = $("#seed-firestore-btn");
        const statusBox = $("#seed-status");

        seedBtn?.addEventListener("click", async () => {
            if (!confirm("This will seed Firestore with your 10 existing projects and 4 blog posts. Continue?")) return;

            seedBtn.disabled = true;
            seedBtn.textContent = "Migrating to Firestore…";
            if (statusBox) {
                statusBox.style.display = "block";
                statusBox.textContent = "Seeding data into Cloud Firestore...";
            }

            try {
                const metadata = typeof projectMetadata === "object" ? projectMetadata : {};
                const fallbackAssets = typeof projectAssetFallback === "object" ? projectAssetFallback : {};
                const posts = Array.isArray(window.blogPosts) ? window.blogPosts : [];

                const result = await window.FirebaseService.seedInitialData(metadata, fallbackAssets, posts);

                if (statusBox) {
                    statusBox.innerHTML = `✓ Migration successful! Seeded <strong>${result.seededProjects} projects</strong> and <strong>${result.seededPosts} blog posts</strong> into Firestore.`;
                }

                await loadDashboardData();
            } catch (err) {
                if (statusBox) {
                    statusBox.innerHTML = `<span style="color: #ff5566;">Error seeding data: ${escapeHtml(err.message)}</span>`;
                }
            } finally {
                seedBtn.disabled = false;
                seedBtn.textContent = "Seed Existing Data to Firestore";
            }
        });
    }

    function initialize() {
        initAuth();
        initTabs();
        initProjectEditor();
        initPostEditor();
        initSyncTools();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize);
    } else {
        initialize();
    }
})();
