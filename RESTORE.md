# 🔄 FitCoachConnect - Clean State Restoration Guide

This document explains how to restore your FitCoachConnect application to the clean state with **5 class types** and **25 exercises**.

## 📊 Clean State Overview

- **5 Popular Class Types**: Yoga, Zumba, Spinning/Indoor Cycling, HIIT, Pilates
- **25 Professional Exercises**: 5 exercises per class type with complete details
- **Test User Account**: `test@fitcoach.com` / `password123`
- **Clean Database**: No duplicates, properly structured data
- **Working Environment**: Local development server ready to run

---

## 🚀 Quick Restore Options

### Option 1: Database-Only Restore (Fastest)
```bash
# Restore just the database to clean state
node restore_clean_state.js
```

### Option 2: Git Restore (Code + Database)
```bash
# Restore to the tagged clean state
git checkout v1.0-clean-state

# Then restore database
node restore_clean_state.js
```

### Option 3: Manual SQL Restore
```bash
# Execute the SQL script in your database
psql your_database < restore_fitcoach_clean_2025-08-30_10-14-02.sql
```

---

## 🛠️ Development Environment Setup

### Prerequisites
- Node.js installed
- Access to Neon PostgreSQL database

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL

# 3. Start development server
npm run dev

# 4. Access application
# http://localhost:5000
```

### Login Credentials
- **Email**: `test@fitcoach.com`
- **Password**: `password123`

---

## 📋 What Gets Restored

### Database Tables
- ✅ `class_types` - 5 popular fitness class types
- ✅ `exercises` - 25 professional exercises with full details
- ✅ `users` - Test user account (preserved)
- 🧹 `routines` - Cleared (ready for new data)
- 🧹 `calendar_events` - Cleared (ready for new data)
- 🧹 All other tables - Cleared (ready for new data)

### Files Included
- `backup_fitcoach_clean_*.json` - Complete data backup
- `restore_fitcoach_clean_*.sql` - SQL restoration script  
- `restore_clean_state.js` - Quick restore script
- Various cleanup and migration scripts

---

## 🎯 Verification

After restoration, verify the clean state:

1. **Check Class Types**: Should see exactly 5 class types
2. **Check Exercises**: Should see exactly 25 exercises total (5 per class)
3. **Login Test**: Use `test@fitcoach.com` / `password123`
4. **No Duplicates**: Verify no duplicate entries anywhere

---

## 🆘 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` in `.env` file
- Check Neon database is accessible
- Ensure database credentials are correct

### Restore Script Fails
- Try manual SQL restore (Option 3)
- Check console for specific error messages
- Verify all dependencies are installed

### Server Won't Start
- Check port 5000 isn't in use: `netstat -ano | findstr :5000`
- Kill existing processes if needed
- Restart with `npm run dev`

---

## 📚 Development Tips

### Adding New Features
1. Always commit your changes before major modifications
2. Create feature branches: `git checkout -b feature/new-feature`
3. Test thoroughly before merging
4. Use the backup system if things go wrong

### Creating New Backups
```bash
# Create a new backup of current state
node create-database-backup.js

# Commit your changes
git add -A && git commit -m "Your changes"

# Tag important milestones
git tag -a v1.1-feature-name -m "Description"
```

---

## 🏷️ Git Tags

- `v1.0-clean-state` - The clean baseline state (5 class types, 25 exercises)
- Use `git tag` to see all available restore points

---

*🤖 This restoration system was created to ensure you can always return to a clean, working state when adding new features to your FitCoachConnect application.*