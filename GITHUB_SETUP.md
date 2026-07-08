# SKY4444 GitHub Setup & Deployment Guide

## Quick Start: View Live on GitHub Pages (FREE)

### Step 1: Export to GitHub

1. Go to your Manus project Management UI
2. Click the **More** menu (⋯) in top-right
3. Select **GitHub**
4. Choose your GitHub account/organization
5. Enter repository name: `skycoin4444` (or your choice)
6. Click **Export**

### Step 2: Enable GitHub Pages

1. Go to your GitHub repository: `https://github.com/YOUR_USERNAME/skycoin4444`
2. Click **Settings** → **Pages**
3. Under "Build and deployment":
   - Source: **Deploy from a branch**
   - Branch: **gh-pages** (or **main** if using main branch)
   - Folder: **/ (root)**
4. Click **Save**

### Step 3: View Your Site Live

After 1-2 minutes, your site will be available at:
```
https://YOUR_USERNAME.github.io/skycoin4444
```

---

## Automated Deployment Setup

### GitHub Actions Workflow

The project includes a GitHub Pages deployment workflow (`.github/workflows/github-pages.yml`) that:

- ✅ Automatically builds on every push to `main`
- ✅ Deploys to GitHub Pages
- ✅ Runs security checks
- ✅ Generates production build

### Manual Trigger

To manually deploy:

1. Go to your repository
2. Click **Actions**
3. Select **Deploy to GitHub Pages**
4. Click **Run workflow**
5. Select **main** branch
6. Click **Run workflow**

---

## Environment Variables for GitHub Pages

Create a `.env.production` file in your project:

```env
VITE_APP_TITLE=SKY4444
VITE_APP_ID=skycoin4444
VITE_ANALYTICS_ENDPOINT=https://analytics.sky4444.com
VITE_ANALYTICS_WEBSITE_ID=sky4444
VITE_CORS_ORIGIN=https://YOUR_USERNAME.github.io
```

---

## Alternative: Deploy to Vercel (Even Easier)

### Step 1: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click **Import Project**
4. Select your `skycoin4444` repository
5. Click **Import**

### Step 2: Configure

- **Framework**: Vite
- **Build Command**: `pnpm build`
- **Output Directory**: `dist`

### Step 3: Deploy

Click **Deploy** and your site will be live at:
```
https://skycoin4444.vercel.app
```

---

## Alternative: Deploy to Netlify

### Step 1: Connect to Netlify

1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click **Import an existing project**
4. Select your `skycoin4444` repository

### Step 2: Configure

- **Build command**: `pnpm build`
- **Publish directory**: `dist`

### Step 3: Deploy

Click **Deploy site** and your site will be live at:
```
https://skycoin4444.netlify.app
```

---

## Repository Structure

```
skycoin4444/
├── .github/
│   ├── workflows/
│   │   ├── github-pages.yml      ← GitHub Pages deployment
│   │   ├── ci-cd-pipeline.yml    ← Testing & linting
│   │   └── deploy.yml            ← Production deployment
│   └── dependabot.yml            ← Security updates
├── client/                        ← React frontend
│   ├── src/
│   │   ├── components/           ← UI components
│   │   ├── pages/                ← Page components
│   │   └── App.tsx               ← Main app
│   └── index.html
├── server/                        ← Express backend
│   ├── routers.ts                ← tRPC procedures
│   ├── db.ts                     ← Database queries
│   └── _core/                    ← Core utilities
├── drizzle/                       ← Database schema
├── dist/                          ← Build output
├── package.json
├── pnpm-lock.yaml
├── vite.config.ts
└── README.md
```

---

## Troubleshooting

### Site shows 404

- Ensure GitHub Pages is enabled in Settings
- Check that build completed successfully in Actions
- Verify the `dist` folder exists after build

### Build fails

- Check GitHub Actions logs for errors
- Ensure all environment variables are set
- Run `pnpm install && pnpm build` locally to test

### Slow deployment

- GitHub Pages can take 1-5 minutes to deploy
- Check Actions tab to see deployment progress
- Clear browser cache and hard refresh (Ctrl+Shift+R)

---

## Security & Performance

### Security Headers

The project includes security headers configured in:
- `vite.config.ts` - Development server
- `.github/workflows/github-pages.yml` - Production build

### Performance Optimization

- ✅ Code splitting via Vite
- ✅ Tree-shaking of unused code
- ✅ Minification and compression
- ✅ Lazy loading of components
- ✅ Image optimization

---

## Monitoring & Analytics

### GitHub Actions Monitoring

1. Go to **Actions** tab
2. View workflow runs
3. Check logs for any issues

### Performance Monitoring

- Use Lighthouse (built into Chrome DevTools)
- Check GitHub Pages deployment logs
- Monitor Core Web Vitals

---

## Next Steps

1. ✅ Export project to GitHub
2. ✅ Enable GitHub Pages
3. ✅ View site live at `https://YOUR_USERNAME.github.io/skycoin4444`
4. ✅ Share the link with team/users
5. ✅ Monitor deployments in GitHub Actions

---

## Support

For issues or questions:
- Check GitHub Actions logs
- Review this guide
- Check Manus documentation
- Contact support

---

**Last Updated:** 2026-07-08
**Status:** Ready for Deployment
