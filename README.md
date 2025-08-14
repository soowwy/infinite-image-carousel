# Infinite Image Carousel

This project is a technical assessment task to build an infinite image carousel using React. The component fetches images from a public API and displays them in a continuously scrolling gallery.

# Getting Started

To run this project locally, follow these steps:

# Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (latest version recommended)
- npm (comes with Node.js)

# Clone the repository:

git clone https://github.com/soowwy/infinite-image-carousel.git
cd infinite-image-carousel

# Install dependencies:

npm install

# or

yarn install

# Run the development server:

npm run dev

# or

yarn dev
The application will be available at http://localhost:5173.

# To run tests:

npm run test

# or

rpm run test:ui

# Key Features

Infinite Scrolling Logic: The carousel uses a "pruning" technique to manage a fixed number of images in the DOM. When new images are fetched and added, old images are removed from the opposite end, maintaining performance and memory efficiency.

Precise Scroll Adjustment: The component uses useLayoutEffect to make synchronous scroll adjustments. This prevents visual "jumps" and ensures the user's current position remains stable after images are added or removed.

Lazy Loading: Images are loaded on demand as they enter the viewport, reducing initial load times and bandwidth usage.

Unit Testing: The component's core functionality is verified with a unit test using Vitest and React Testing Library, ensuring the infinite scrolling and fetch logic works as expected.

# Tech Stack

React: The core library for building the user interface.

TypeScript: Provides static typing for improved code quality and maintainability.

Vite: A fast development server and build tool.

Sass: Used for modular and maintainable CSS styling.

Vitest: A modern testing framework for unit and component testing.

picsum.photos API: The public API used to fetch placeholder images.
