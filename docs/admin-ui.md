# Integrated Admin and Eligibility Search UI Project

## Product Description

The Integrated Admin and Eligibility Search UI is designed to empower
administrators to configure and manage eligibility rules while enabling
efficient eligibility searches. This unified project provides a seamless
user experience by combining rule management and eligibility searching
in a single application. The product features easy navigation between
rule creation and eligibility searches, enhancing productivity and
efficiency for healthcare administrators.

## Design and Theme

- **Design Framework:** Tailwind CSS for streamlined UI development and
  custom styling.

- **Theme:** Professional, with a clean and intuitive user interface.
  Support for both light and dark modes to enhance usability in various
  lighting conditions.

- **Color Scheme:** Use of calming blues and neutral tones to align with
  healthcare industry norms.

## Required Development Stack

- **Frontend:**

  - React with React Router for Single Page Application (SPA)
    architecture, providing dynamic routing.

  - Tailwind CSS for a responsive and modern UI.

- **Backend:** Node.js, Express for server-side logic.

- **API Framework:** RESTful API for integration with the eligibility
  engine and data sources.

## Application Backend Requirements

- **Authentication:** Auth0 for secure access management.

- **Database:** PostgreSQL for storing rule configurations, logging
  changes, and managing search data.

- **ORM:** Prisma for database interaction and management.

- **DevOps:** Docker for containerization, enabling easy deployment and
  scalability.

## Navigation and State Management

- Use Redux or Context API for shared state management across the admin
  and search interfaces.

- Implement a navigation bar or links for easy switching between /admin
  for rules management and /search for eligibility searches, ensuring
  seamless navigation.

## Role-Based Access

- Implement routing guards for secure access, ensuring only authorized
  users can access admin routes.

## Common Components

- Utilize shared components like headers and footers to maintain a
  cohesive experience across the application.

## Explicitly Defined Product Flows

1.  **Administrator Login**

    - Admins log in using secure authentication, gaining access to both
      rule management and the search interface.

2.  **Rule Creation and Management**

    - Admins can create new eligibility rules, specifying conditions and
      logic.

    - Ability to view, edit, and delete existing rules.

    - Audit trail functionality to track rule changes and who made them.

3.  **Eligibility Search**

    - Search interface for querying eligibility status using defined
      parameters.

    - Display results and potential actions based on eligibility
      outcomes.

4.  **Rule Testing and Simulation**

    - Admins can test rules against sample data to ensure accuracy.

    - Simulation mode to preview rule impacts without affecting live
      data.

5.  **Settings and Configuration**

    - Access to configure system settings, such as notification
      preferences and data refresh rates.

## Development Environment

- Organize file structure with separate folders for admin and search UI,
  compiling them into a single build directory for consistency.

## Explicit Directions for AI Generation

- The AI should focus on providing an intuitive user experience,
  enabling admins to manage complex rules without needing deep technical
  expertise.

- Implement suggestions and validations to help admins avoid rule
  conflicts.

- Ensure security best practices are in place, particularly around
  sensitive data handling and access control.

- Incorporate analytics to provide insights into rule performance and
  system usage.
