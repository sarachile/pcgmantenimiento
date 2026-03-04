# **App Name**: PCGMANTENIMIENTO

## Core Features:

- Company Management: Establish a multi-tenant structure, allowing registration and management of individual companies, each with isolated data and configurable settings. Essential for the ERP SaaS model.
- User and Role Management: Administer users for each company, assigning specific roles (companyAdmin, supervisor, tecnico, reviewer) to control access and permissions. Facilitates secure, role-based access.
- Work Order (OT) Management: Create, assign, track, and manage work orders through a defined lifecycle: creada → asignada → ejecutada → en revisión → aprobada/rechazada. Includes details like description, assigned technician, and status.
- Digital Logbook per Work Order: Automatically generate a unique, auditable, and immutable digital logbook for each work order upon creation. Records all significant events and modifications related to the OT.
- Work Order Review and Approval Workflow: Enable 'reviewer' users to review executed work orders and their associated digital logbooks, allowing them to approve or reject an OT. Approval makes the logbook immutable.
- Maintenance Report Summary Tool: A generative AI tool that automatically processes detailed work order data and digital logbook entries to provide a concise, readable summary of maintenance actions, issues, and resolutions, assisting reviewers and company admins.
- Subscription Management (Basic): Core functionality to manage company subscriptions to the SaaS platform, ensuring only active companies can access their data and services.

## Style Guidelines:

- The visual scheme embraces a professional and dependable aesthetic with a light background. The primary color, a deep, muted indigo blue (#2B4DAA), signifies reliability and strength, grounding the user interface. It is chosen for its authoritative yet approachable quality, ideal for an ERP system.
- A subtly textured light gray-blue background (#E9ECF4) provides a clean canvas, reducing eye strain and allowing content to take precedence. Its minimal saturation ensures it complements the primary blue without distraction, maintaining visual harmony.
- For an accent, a vibrant magenta-purple (#6B30DB) is employed. This analogous hue, set to the right of the primary on the color wheel, offers a distinct pop without clashing, ideal for calls to action, important notifications, and highlighting interactive elements, ensuring strong visual hierarchy.
- The application exclusively uses 'Inter', a modern grotesque sans-serif font. Its neutral, objective appearance and high readability make it ideal for data-intensive ERP screens, ensuring clarity and professionalism for both headlines and body text.
- Simple, clean, and intuitive vector-based icons will be used. These icons are designed to be easily recognizable and to convey function at a glance, minimizing cognitive load for users interacting with complex system elements.
- A structured and grid-based layout prioritizes efficiency and clarity, organizing complex information into manageable, logical sections. Ample white space will be used to reduce visual clutter, and consistent component placement will enhance navigability across different modules.
- Subtle, functional animations will be incorporated to provide immediate feedback on user interactions and state changes (e.g., successful submission, loading data, workflow status transitions). These animations will be smooth and brief, improving the user experience without causing distractions.