# GitHub Enterprise + Manus Integration Setup

## Step 1: Connect GitHub Enterprise to Manus

### Via Manus Management UI:

1. **Open your Manus project**
   - Go to Management UI
   - Click **More** (⋯) in top-right corner
   - Select **GitHub**

2. **Authorize GitHub Enterprise**
   - Click "Connect GitHub Enterprise"
   - Enter your GitHub Enterprise domain: `https://github.enterprise.com` (or your custom domain)
   - Click "Authorize"
   - You'll be redirected to GitHub Enterprise login
   - Sign in with your enterprise credentials
   - Click "Authorize Manus" to grant access

3. **Grant Permissions**
   - Allow Manus to:
     - Read repository contents
     - Write to repositories
     - Manage GitHub Pages
     - Access workflows

### Via GitHub Enterprise Settings:

1. Go to your GitHub Enterprise instance
2. Navigate to **Settings** → **Developer settings** → **OAuth Apps**
3. Create new OAuth App:
   - Application name: `Manus`
   - Homepage URL: `https://manus.im`
   - Authorization callback URL: `https://manus.im/auth/github/callback`
4. Copy **Client ID** and **Client Secret**
5. Add to Manus project settings

---

## Step 2: Export Project to GitHub Enterprise

### Using Manus UI:

1. Open your Manus project Management UI
2. Click **More** (⋯) → **GitHub**
3. Select **GitHub Enterprise** from dropdown
4. Choose your organization/account
5. Enter repository name: `skycoin4444` or `skycoin-ecosystem`
6. Select visibility: **Public** (for GitHub Pages) or **Private**
7. Click **Export**

### What Gets Exported:
- ✅ Full source code
- ✅ All dependencies (package.json, pnpm-lock.yaml)
- ✅ GitHub Actions workflows
- ✅ Configuration files
- ✅ Database schema
- ✅ Documentation

---

## Step 3: Enable GitHub Pages in Enterprise

### GitHub Enterprise Pages Setup:

1. Go to your GitHub Enterprise repository
2. Click **Settings** (gear icon)
3. Scroll to **GitHub Pages** section
4. Under "Build and deployment":
   - **Source**: Select "Deploy from a branch"
   - **Branch**: Select `gh-pages` (or `main` if using main branch)
   - **Folder**: Select `/ (root)`
5. Click **Save**

### Configure Custom Domain (Optional):

1. In GitHub Pages settings
2. Under "Custom domain"
3. Enter your domain: `skycoin4444.yourdomain.com`
4. Click **Save**
5. Add DNS CNAME record:
   ```
   CNAME skycoin4444 YOUR_GITHUB_PAGES_URL
   ```

---

## Step 4: Configure GitHub Actions for Deployment

### Automatic Deployment Workflow:

The project includes `.github/workflows/github-pages.yml` which:

1. **Triggers on push to main branch**
2. **Runs tests and security checks**
3. **Builds production bundle**
4. **Deploys to GitHub Pages**

### Manual Deployment:

1. Go to your repository on GitHub Enterprise
2. Click **Actions** tab
3. Select **Deploy to GitHub Pages** workflow
4. Click **Run workflow**
5. Select branch: `main`
6. Click **Run workflow**

### Monitor Deployment:

1. Go to **Actions** tab
2. Click the running workflow
3. View build logs in real-time
4. Check deployment status

---

## Step 5: Verify Live Deployment

### Check GitHub Pages Status:

1. Go to repository **Settings** → **Pages**
2. Look for green checkmark next to "Your site is live at:"
3. Click the URL to view your live site

### Your Site URL:

**GitHub Pages URL:**
```
https://YOUR_ENTERPRISE_ACCOUNT.github.io/skycoin4444
```

**Custom Domain (if configured):**
```
https://skycoin4444.yourdomain.com
```

### Verify Site is Working:

- [ ] Homepage loads
- [ ] Navigation menu works
- [ ] All 13 categories accessible
- [ ] Live crypto prices updating
- [ ] Trading dashboard functional
- [ ] Social feed loading
- [ ] Portfolio management accessible

---

## Step 6: Set Up Continuous Deployment

### Enable Auto-Deploy on Push:

1. Go to **Settings** → **Branches**
2. Under "Branch protection rules"
3. Create rule for `main` branch:
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date
   - ✅ Dismiss stale pull request approvals

### GitHub Actions Secrets:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add secrets needed for deployment:
   ```
   VITE_APP_TITLE=SKY4444
   VITE_APP_ID=skycoin4444
   VITE_ANALYTICS_ENDPOINT=https://analytics.sky4444.com
   VITE_ANALYTICS_WEBSITE_ID=sky4444
   ```

---

## Troubleshooting

### Site Shows 404

**Solution:**
1. Check GitHub Pages is enabled in Settings
2. Verify branch is set to `gh-pages` or `main`
3. Check build completed successfully in Actions
4. Clear browser cache (Ctrl+Shift+R)

### Build Fails

**Solution:**
1. Check Actions logs for error messages
2. Verify all environment variables are set
3. Run `pnpm install && pnpm build` locally to test
4. Check for TypeScript errors: `pnpm tsc --noEmit`

### Deployment Takes Too Long

**Solution:**
1. GitHub Pages can take 1-5 minutes
2. Check Actions tab for progress
3. Verify workflow completed successfully
4. Try hard refresh (Ctrl+Shift+R)

### Custom Domain Not Working

**Solution:**
1. Verify CNAME record is set correctly
2. Wait 24-48 hours for DNS propagation
3. Check SSL certificate is issued
4. Verify domain is added in GitHub Pages settings

---

## Security Best Practices

### Protect Main Branch:

1. **Require pull request reviews**
2. **Require status checks to pass**
3. **Require branches to be up to date**
4. **Restrict who can push**

### Manage Secrets:

1. Never commit `.env` files
2. Use GitHub Secrets for sensitive data
3. Rotate tokens regularly
4. Audit access logs

### Monitor Deployments:

1. Enable Slack notifications
2. Monitor GitHub Actions logs
3. Set up alerts for failures
4. Review deployment history

---

## Performance Optimization

### GitHub Pages Performance:

- ✅ CDN distribution across GitHub's servers
- ✅ Automatic caching headers
- ✅ Gzip compression enabled
- ✅ HTTP/2 support

### Optimize Build Time:

1. Use pnpm for faster installs
2. Cache dependencies in Actions
3. Parallel test execution
4. Incremental builds

### Monitor Performance:

1. Use Lighthouse (Chrome DevTools)
2. Check Core Web Vitals
3. Monitor page load times
4. Analyze bundle size

---

## Next Steps

1. ✅ Connect GitHub Enterprise to Manus
2. ✅ Export project to GitHub Enterprise
3. ✅ Enable GitHub Pages
4. ✅ Configure custom domain (optional)
5. ✅ Verify live deployment
6. ✅ Set up continuous deployment
7. ✅ Monitor and optimize

---

## Support & Resources

**GitHub Enterprise Documentation:**
- https://docs.github.com/en/enterprise-server/latest/

**GitHub Pages Documentation:**
- https://docs.github.com/en/pages

**Manus Documentation:**
- https://docs.manus.im

**Need Help?**
- Check GitHub Actions logs
- Review this guide
- Contact Manus support

---

**Last Updated:** 2026-07-08
**Status:** Ready for Enterprise Deployment
