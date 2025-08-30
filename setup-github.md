# 🐙 GitHub Setup for FitCoachConnect

## Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com) and login
2. Click "+" in top right → "New repository"  
3. Repository settings:
   - **Name**: `fitcoach-connect`
   - **Description**: `FitCoachConnect - Group Fitness Trainer Platform with 5 class types and 25 professional exercises`
   - **Visibility**: Public
   - **DON'T** initialize with README (we have files already)
4. Click "Create repository"

## Step 2: Connect Local Git to GitHub

After creating the repository, run these commands in your terminal:

```bash
# Navigate to your project
cd "C:\Users\Claude Henry\.claude\projects\fitflow-clean\FitCoachConnect"

# Add GitHub remote (replace YOUR_GITHUB_USERNAME with your actual username)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/fitcoach-connect.git

# Ensure main branch
git branch -M main  

# Push to GitHub
git push -u origin main

# Push tags as well
git push origin --tags
```

## Step 3: Verify Upload

Visit your GitHub repository to confirm:
- ✅ All files are uploaded
- ✅ Both commits are visible
- ✅ Tags are present (v1.0-clean-state, v1.1-deployment-ready)

## Step 4: Ready for Deployment!

Once on GitHub, you can:
- Deploy to Vercel by importing your GitHub repository
- Share the repository with collaborators  
- Set up automatic deployments

## 🔐 Authentication

If prompted for credentials:
- **Username**: Your GitHub username
- **Password**: Use a Personal Access Token (not your GitHub password)
  - Go to GitHub Settings → Developer settings → Personal access tokens
  - Create token with `repo` permissions

## ✅ What Gets Uploaded

Your repository will include:
- 📱 Complete React frontend
- 🖥️ Node.js/Express backend  
- 🗄️ Database schema and migrations
- 🚀 Vercel deployment configuration
- 📚 Documentation and guides
- 🔄 Backup and restore system
- 🏷️ Git tags for version control

Perfect baseline for web deployment! 🎉