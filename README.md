# EF361.github.io  
![GitHub Pages](https://img.shields.io/badge/Hosted_on-GitHub_Pages-blue)  
![Tech Stack](https://img.shields.io/badge/Tech_Stack-JavaScript_ES6%2B%2C_HTML5%2C_CSS3-lightgrey)  
![License](https://img.shields.io/badge/License-MIT-green)  
[![Live Demo](https://img.shields.io/badge/Demo-Live_Project-blueviolet)](https://ef361.github.io)

## Executive Summary  
**EF361.github.io** is a clean, fast, and accessible personal portfolio showcasing Alicia Goh's expertise as an AI & Software Engineer. Built with performance and usability in mind, the repository integrates modern web standards, semantic HTML, robust accessibility features, and spam-protected form handling to create a memorable user experience.

---

## Key Features  
- **Optimized Media**: All images, videos, and fonts are compressed to minimize file size while maintaining quality.  
- **Performance Metrics**: Verified with Lighthouse, achieving **90+ scores** in Performance, Accessibility, Best Practices, and SEO.  
- **Semantic and Responsive Design**: Built with semantic HTML5 and mobile-first principles for exceptional cross-device compatibility. Fully keyboard-accessible and supports visible focus indicators.  
- **Accessibility Enhancements**: Includes sufficient color contrast, ARIA roles, reduced motion preferences, and WCAG-compliant navigation.  
- **Contact Form Security**: A contact form that protects against spam and abuse through invisible CAPTCHA and sanitization. Data transmission is subjected to client-side validation to safeguard sensitive user input.  
- **CI/CD-Integrated Validations**: Automated workflows detect and prevent broken links, invalid HTML, JavaScript errors, and layout responsiveness issues.  
- **Third-Party Transparency**: Fully disclosed use of any external libraries or trackers for ethics and compliance.

---

## Architecture & Workflow  

```mermaid
graph TD
    A[User Visit] --> B[Landing Page];
    B --> C[Navigation Menu];
    B --> D[Portfolio Showcase];
    B --> E[Contact Form];
    E --> F[Spam Prevention with Invisible CAPTCHA];
    F --> G[Form Submission];
    G --> H[Client-side Validation];
    G -.->|Email Results| I[Secure Email Processing (via 3rd-party)];
    H --> I;
    A --> L[Responsive Design for Desktop & Mobile]
```

1. Users interact on desktop and mobile devices with adaptive layouts.  
2. Interactive design enhances user experience (keyboard navigation, reduced motion).  
3. The secure contact form validates, protects input, and forwards it privately via email integration.  

---

## Tech Stack & Tools Breakdown  

| **Category**         | **Technology**                     |  
|-----------------------|------------------------------------|  
| **Frontend**          | JavaScript (ES6+), HTML5, CSS3    |  
| **Hosting**           | GitHub Pages                      |  
| **Tools**             | Lighthouse, GitHub Actions        |  
| **Performance Testing** | WebP Image Compression, Lighthouse |  
| **Accessibility**     | ARIA Roles, WCAG Standards        |  

---

## Quickstart / Installation  

Clone the repository and host locally for development:  
```bash
git clone https://github.com/EF361/EF361.github.io.git
cd EF361.github.io
```

To view or edit the project:  
1. Open `index.html` in your web browser.  
2. Serve locally for hot reload (requires Node.js):  
   ```bash
   npm install -g live-server
   live-server
   ```

---

## Performance & Accessibility Metrics  

| **Lighthouse Metric**          | **Score** |  
|--------------------------------|-----------|  
| **Performance**                | 95+       |  
| **Accessibility**              | 100       |  
| **Best Practices**             | 95+       |  
| **SEO**                        | 100       |  

---

## Contribution Guidelines  

1. **Fork the Repository**: Create your branch from `main`.  
2. **Code Linting**: Ensure your code passes automated CI checks and follows project standards.  
3. **Submit a PR**: Clearly document changes for easy review by maintainers.  

---

## License  

This repository is open-sourced under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments  

Special thanks to performance tools and standards like Google Lighthouse, WCAG Accessibility Guidelines, and GitHub Actions for enabling a robust and scalable portfolio framework.