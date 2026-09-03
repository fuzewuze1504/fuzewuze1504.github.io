# Student Portfolio Editing Guide

## Main files to edit

- app/portfolio.tsx — name, school, subject, professor, skills, email, and social links.
- app/globals.css — colors, spacing, cards, and responsive design.
- public/ — place your profile picture and other static images here.

Search for text inside square brackets such as [YOUR FULL NAME] and replace it.

## Add your profile picture

1. Copy your photo into public/ and name it profile.jpg.
2. Replace the portrait placeholder inside app/portfolio.tsx with an image.

## Run the website locally

1. Install Node.js 22.
2. Open this folder in VS Code.
3. Open Terminal and run npm install.
4. Run npm run dev.

## Publish with GitHub Pages

1. Upload the complete project to a GitHub repository.
2. Open the repository's Settings, then Pages.
3. Under Build and deployment, choose GitHub Actions.
4. Open the Actions tab and wait for the deployment to finish.
5. Every push to the main branch automatically updates the website.

The included deployment workflow automatically fixes asset paths whether you
use a normal project repository or a username.github.io repository.

The Supabase publishable key in this project is safe for browser use. Never add
the database password, secret key, or service-role key to this repository.
