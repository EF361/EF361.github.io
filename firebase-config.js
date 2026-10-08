/**
 * ============================================================================
 * FIREBASE CONFIGURATION & SERVICE CLIENT
 * Alicia Goh Portfolio & Blog CMS
 * ============================================================================
 */
(() => {
    "use strict";

    // Default configuration created via Firebase CLI
    const DEFAULT_CONFIG = {
        apiKey: "AIzaSyAciJZyO2qEHvCeOHFHYbwC1iZHjIj009w",
        authDomain: "alicia-goh-portfolio.firebaseapp.com",
        projectId: "alicia-goh-portfolio",
        storageBucket: "alicia-goh-portfolio.firebasestorage.app",
        messagingSenderId: "411278522628",
        appId: "1:411278522628:web:c711f4cb865b209d3ef851"
    };

    const ADMIN_EMAIL = "aliciagoh0704@gmail.com";

    function getActiveConfig() {
        try {
            const saved = localStorage.getItem("alicia_custom_firebase_config");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.apiKey && parsed.projectId) return parsed;
            }
        } catch { /* Fallback to default */ }
        return DEFAULT_CONFIG;
    }

    let app = null;
    let auth = null;
    let db = null;
    let storage = null;
    let initialized = false;

    function initFirebase() {
        if (initialized) return { app, auth, db, storage };
        if (typeof firebase === "undefined") {
            console.warn("Firebase SDK script not loaded yet.");
            return null;
        }

        const config = getActiveConfig();
        if (!config || !config.apiKey) return null;

        try {
            if (!firebase.apps.length) {
                app = firebase.initializeApp(config);
            } else {
                app = firebase.app();
            }
            auth = firebase.auth();
            db = firebase.firestore();
            storage = firebase.storage();
            initialized = true;
            return { app, auth, db, storage };
        } catch (err) {
            console.error("Firebase initialization failed:", err);
            return null;
        }
    }

    const FirebaseService = {
        ADMIN_EMAIL,
        get config() {
            return getActiveConfig();
        },
        saveCustomConfig(newConfig) {
            localStorage.setItem("alicia_custom_firebase_config", JSON.stringify(newConfig));
            initialized = false;
            window.location.reload();
        },
        resetConfig() {
            localStorage.removeItem("alicia_custom_firebase_config");
            initialized = false;
            window.location.reload();
        },
        init: initFirebase,
        get isReady() {
            if (!initialized) initFirebase();
            return Boolean(initialized && db);
        },

        // --- AUTHENTICATION ---
        async signInWithGoogle() {
            initFirebase();
            if (!auth) throw new Error("Firebase Auth is not initialized.");
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.setCustomParameters({ prompt: "select_account" });
            const result = await auth.signInWithPopup(provider);
            const user = result.user;
            
            // Validate admin email authorization
            if (user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
                await auth.signOut();
                throw new Error(`Access Denied: ${user.email} is not authorized. Only ${ADMIN_EMAIL} can access the admin dashboard.`);
            }
            return user;
        },

        async signOut() {
            if (auth) await auth.signOut();
        },

        onAuthStateChanged(callback) {
            initFirebase();
            if (!auth) return () => {};
            return auth.onAuthStateChanged(user => {
                if (user && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
                    callback(user);
                } else {
                    callback(null);
                }
            });
        },

        // --- PROJECTS CRUD ---
        async getProjects() {
            initFirebase();
            if (!db) return [];
            try {
                const snapshot = await db.collection("projects").get();
                if (snapshot.empty) return [];
                const projects = [];
                snapshot.forEach(doc => {
                    projects.push({ id: doc.id, ...doc.data() });
                });
                return projects.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
            } catch (err) {
                console.warn("Could not fetch projects from Firestore:", err);
                return [];
            }
        },

        async saveProject(projectData) {
            initFirebase();
            if (!db) throw new Error("Firestore not initialized.");
            const id = projectData.id;
            if (!id) throw new Error("Project ID is required.");
            const docRef = db.collection("projects").doc(id);
            const payload = {
                ...projectData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await docRef.set(payload, { merge: true });
            return { id, ...payload };
        },

        async deleteProject(projectId) {
            initFirebase();
            if (!db) throw new Error("Firestore not initialized.");
            await db.collection("projects").doc(projectId).delete();
        },

        // --- BLOG POSTS CRUD ---
        async getBlogPosts() {
            initFirebase();
            if (!db) return [];
            try {
                const snapshot = await db.collection("posts").get();
                if (snapshot.empty) return [];
                const posts = [];
                snapshot.forEach(doc => {
                    posts.push({ id: doc.id, ...doc.data() });
                });
                return posts.sort((a, b) => {
                    const aDate = a.createdAt?.seconds || 0;
                    const bDate = b.createdAt?.seconds || 0;
                    return bDate - aDate;
                });
            } catch (err) {
                console.warn("Could not fetch blog posts from Firestore:", err);
                return [];
            }
        },

        async saveBlogPost(postData) {
            initFirebase();
            if (!db) throw new Error("Firestore not initialized.");
            const id = postData.id;
            if (!id) throw new Error("Post Slug/ID is required.");
            const docRef = db.collection("posts").doc(id);
            const payload = {
                ...postData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            if (!postData.createdAt) {
                payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            }
            await docRef.set(payload, { merge: true });
            return { id, ...payload };
        },

        async deleteBlogPost(postId) {
            initFirebase();
            if (!db) throw new Error("Firestore not initialized.");
            await db.collection("posts").doc(postId).delete();
        },

        // --- STORAGE UPLOADS ---
        uploadMediaFile(folder, file, onProgress) {
            initFirebase();
            if (!storage) throw new Error("Firebase Storage not initialized.");
            
            return new Promise((resolve, reject) => {
                const safeFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
                const storagePath = `${folder}/${safeFileName}`;
                const storageRef = storage.ref().child(storagePath);
                const uploadTask = storageRef.put(file);

                uploadTask.on(
                    "state_changed",
                    snapshot => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        if (typeof onProgress === "function") {
                            onProgress(Math.round(progress));
                        }
                    },
                    error => {
                        reject(error);
                    },
                    async () => {
                        try {
                            const downloadUrl = await uploadTask.snapshot.ref.getDownloadURL();
                            resolve({
                                downloadUrl,
                                storagePath,
                                fileName: file.name,
                                fileType: file.type
                            });
                        } catch (err) {
                            reject(err);
                        }
                    }
                );
            });
        },

        // --- ONE-CLICK SEED MIGRATION ---
        async seedInitialData(projectMetadata, fallbackAssets, blogPosts) {
            initFirebase();
            if (!db) throw new Error("Firestore not initialized.");

            let seededProjects = 0;
            let seededPosts = 0;

            // Seed Projects
            if (projectMetadata && typeof projectMetadata === "object") {
                const ids = Object.keys(projectMetadata);
                for (let index = 0; index < ids.length; index++) {
                    const id = ids[index];
                    const meta = projectMetadata[id] || {};
                    const assets = fallbackAssets?.[id] || [];
                    const images = assets.filter(p => /\.(png|jpe?g|webp|gif|avif)$/i.test(p));
                    const videos = assets.filter(p => /\.(mp4|webm|mov)$/i.test(p));
                    const documents = assets.filter(p => /\.pdf$/i.test(p));

                    await db.collection("projects").doc(id).set({
                        id,
                        title: meta.title || id,
                        description: meta.description || "",
                        tags: meta.tags || ["Project"],
                        githubLink: "",
                        demoLink: "",
                        images,
                        videos,
                        documents,
                        order: index + 1,
                        featured: true,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                    seededProjects++;
                }
            }

            // Seed Blog Posts
            if (Array.isArray(blogPosts)) {
                for (let index = 0; index < blogPosts.length; index++) {
                    const post = blogPosts[index];
                    if (!post.id) continue;
                    await db.collection("posts").doc(post.id).set({
                        ...post,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                    seededPosts++;
                }
            }

            return { seededProjects, seededPosts };
        }
    };

    if (typeof window !== "undefined") {
        window.FirebaseService = FirebaseService;
        // Auto-initialize if SDK is present
        if (typeof firebase !== "undefined") {
            FirebaseService.init();
        }
    }
})();
