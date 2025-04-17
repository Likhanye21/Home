// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    });
});

// Navbar background change on scroll
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
    }
});

// Loading state management
const loadingStates = {
    portfolio: false,
    contact: false
};

function showLoading(section) {
    loadingStates[section] = true;
    const container = document.querySelector(`.${section}-content`) || document.querySelector(`.${section}`);
    if (container) {
        container.classList.add('loading');
        container.innerHTML = `<div class="loader"></div>`;
    }
}

function hideLoading(section) {
    loadingStates[section] = false;
    const container = document.querySelector(`.${section}-content`) || document.querySelector(`.${section}`);
    if (container) {
        container.classList.remove('loading');
    }
}

function showError(section, message) {
    const container = document.querySelector(`.${section}-content`) || document.querySelector(`.${section}`);
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
                <button onclick="retryLoad('${section}')" class="retry-btn">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

async function retryLoad(section) {
    if (section === 'portfolio') {
        await loadPortfolioData();
    }
}

// Fetch and display portfolio data
async function loadPortfolioData() {
    showLoading('projects');
    try {
        const response = await fetch('http://localhost:3000/api/portfolio');
        if (!response.ok) {
            throw new Error('Failed to load portfolio data');
        }
        const data = await response.json();
        
        updateProfile(data.profile);
        updateProjects(data.projects);
    } catch (error) {
        console.error('Error loading portfolio data:', error);
        showError('projects', 'Failed to load projects. Please try again.');
    } finally {
        hideLoading('projects');
    }
}

function updateProfile(profile) {
    if (!profile) return;
    
    // Update hero section with GitHub profile info
    const bioElement = document.querySelector('.hero p');
    if (bioElement && profile.bio) {
        bioElement.textContent = profile.bio;
    }

    // Add GitHub stats to about section
    const aboutSection = document.querySelector('.about-content');
    if (aboutSection) {
        const statsElement = document.createElement('div');
        statsElement.className = 'github-stats';
        statsElement.innerHTML = `
            <h3>GitHub Stats</h3>
            <div class="stats-grid">
                <div class="stat">
                    <span class="number">${profile.public_repos}</span>
                    <span class="label">Repositories</span>
                </div>
                <div class="stat">
                    <span class="number">${profile.followers}</span>
                    <span class="label">Followers</span>
                </div>
                <div class="stat">
                    <span class="number">${profile.following}</span>
                    <span class="label">Following</span>
                </div>
            </div>
        `;
        
        // Remove existing stats if any
        const existingStats = aboutSection.querySelector('.github-stats');
        if (existingStats) {
            existingStats.remove();
        }
        
        aboutSection.appendChild(statsElement);
    }
}

function updateProjects(projects) {
    const projectsGrid = document.querySelector('.projects-grid');
    if (!projectsGrid) return;

    // Clear existing projects
    projectsGrid.innerHTML = '';

    // Add client projects
    projects.client.forEach(project => {
        addProjectCard(project, projectsGrid, 'Client Project');
    });

    // Add personal projects
    projects.personal.forEach(project => {
        addProjectCard(project, projectsGrid, 'Personal Project');
    });

    // Add GitHub projects
    projects.github
        .filter(repo => !repo.fork) // Only show non-forked repositories
        .sort((a, b) => b.stars - a.stars) // Sort by stars
        .slice(0, 6) // Show top 6 repos
        .forEach(repo => {
            const project = {
                title: repo.name,
                description: repo.description || 'A GitHub project',
                technologies: [repo.language].filter(Boolean),
                link: repo.url,
                stars: repo.stars,
                forks: repo.forks
            };
            addProjectCard(project, projectsGrid, 'Open Source');
        });
}

function addProjectCard(project, container, type) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
        <div class="project-type">${type}</div>
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        <div class="technologies">
            ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
        </div>
        ${project.stars !== undefined ? `
        <div class="github-metrics">
            <span><i class="fas fa-star"></i> ${project.stars}</span>
            <span><i class="fas fa-code-branch"></i> ${project.forks}</span>
        </div>
        ` : ''}
        <a href="${project.link}" class="project-link" ${project.link !== '#' ? 'target="_blank"' : ''}>
            ${project.link === '#' ? 'Coming Soon' : 'View Project'}
        </a>
    `;
    container.appendChild(card);
}

// Form submission handling
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        showLoading('contact');
        
        const formData = {
            name: this.querySelector('input[type="text"]').value,
            email: this.querySelector('input[type="email"]').value,
            message: this.querySelector('textarea').value
        };

        try {
            const response = await fetch('http://localhost:3000/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const submitButton = this.querySelector('button[type="submit"]');
            submitButton.innerHTML = '<i class="fas fa-check"></i> Sent!';
            submitButton.classList.add('success');
            
            setTimeout(() => {
                submitButton.innerHTML = 'Send Message';
                submitButton.classList.remove('success');
            }, 3000);

            contactForm.reset();
        } catch (error) {
            console.error('Error:', error);
            showError('contact', 'Failed to send message. Please try again.');
        } finally {
            hideLoading('contact');
        }
    });
}

// Add animation classes on scroll
const observerOptions = {
    threshold: 0.3
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all sections
document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});

// Projects data
const projects = [
    {
        title: "Bonani Creations E-commerce",
        description: "A full-stack e-commerce platform for a fashion brand, featuring product management, shopping cart, and secure payment integration",
        technologies: ["JavaScript", "HTML/CSS", "PHP", "Web Security"],
        link: "https://www.bonanicreations.com"
    },
    {
        title: "Dazi Online Store",
        description: "E-commerce website with responsive design, user authentication, and product catalog management",
        technologies: ["HTML/CSS", "JavaScript", "PHP"],
        link: "https://www.dazi.co.za"
    },
    {
        title: "Instagram Login Page Clone",
        description: "A secure authentication system implementation with Python backend",
        technologies: ["Python", "PHP", "HTML/CSS"],
        link: "#"
    },
    {
        title: "QPay Application",
        description: "Java-based payment processing system with database integration and encryption",
        technologies: ["Java", "SQL", "Cryptography"],
        link: "#"
    }
];

// Populate projects
const projectsGrid = document.querySelector('.projects-grid');
if (projectsGrid) {
    projects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.innerHTML = `
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            <div class="technologies">
                ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
            </div>
            <a href="${project.link}" class="project-link" ${project.link === '#' ? '' : 'target="_blank"'}>
                ${project.link === '#' ? 'Coming Soon' : 'View Project'}
            </a>
        `;
        projectsGrid.appendChild(projectCard);
    });
}

// Mobile menu functionality
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = mobileMenuBtn.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
    });

    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-times');
        });
    });
}

// Load portfolio data when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadPortfolioData();
});