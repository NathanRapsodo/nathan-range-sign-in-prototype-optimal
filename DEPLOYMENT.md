# Deployment Guide for GitHub Pages

This guide will help you deploy this Next.js prototype to GitHub Pages so your team can view it.

## Prerequisites

- A GitHub account
- Git installed on your machine
- Node.js and npm installed

## Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right, then "New repository"
3. Name your repository (e.g., `sign-in-prototype-optimal`)
4. **Important**: Make it **Public** (GitHub Pages free tier requires public repos, or you need GitHub Pro)
5. **Do NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 2: Initialize Git and Push to GitHub

Open a terminal in the project directory and run:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Rapsodo Golf sign-in prototype"

# Add your GitHub repository as remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 3: Update Base Path (if needed)

If your repository name is different from `sign-in-prototype-optimal`, update `next.config.js`:

```javascript
basePath: process.env.NODE_ENV === 'production' ? '/YOUR_REPO_NAME' : '',
assetPrefix: process.env.NODE_ENV === 'production' ? '/YOUR_REPO_NAME' : '',
```

Replace `YOUR_REPO_NAME` with your actual repository name.

## Step 4: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (top menu)
3. Scroll down to **Pages** (left sidebar)
4. Under **Source**, select:
   - **Source**: `GitHub Actions`
5. Save the settings

## Step 5: Trigger Deployment

The GitHub Actions workflow will automatically deploy when you push to the `main` branch. You can also:

1. Go to the **Actions** tab in your repository
2. You should see the workflow running
3. Wait for it to complete (usually 2-3 minutes)

## Step 6: Access Your Deployed Site

Once deployment completes, your site will be available at:
```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

For example:
```
https://nathanaderogba.github.io/sign-in-prototype-optimal/
```

## Troubleshooting

### Build Fails
- Check the **Actions** tab for error messages
- Ensure all dependencies are in `package.json`
- Make sure `next.config.js` has the correct `basePath`

### 404 Errors on Routes
- This is normal for Next.js static export with client-side routing
- Users should navigate from the home page, not directly to routes
- Consider adding a `404.html` that redirects to index.html

### Images Not Loading
- Ensure `images.unoptimized: true` is in `next.config.js`
- Check that image paths are correct

## Updating the Site

To update the deployed site:

```bash
# Make your changes
# ... edit files ...

# Commit changes
git add .
git commit -m "Update: description of changes"

# Push to GitHub
git push origin main
```

The GitHub Actions workflow will automatically rebuild and redeploy.

## Local Testing

To test the production build locally:

```bash
npm run build
npx serve out
```

Then visit `http://localhost:3000` (or the port shown)
