@echo off
echo Setting up Git and pushing to GitHub repository...

REM Change to the project directory
cd /d "c:\Users\infoo\Desktop\e-ledger.ind\e-ledger.proto"

REM Initialize git repository
git init

REM Add all files to the repository
git add .

REM Create initial commit
git commit -m "Initial commit: E-Ledger system with Supabase authentication integration"

REM Add the remote repository
git remote add origin https://github.com/Engineer-oam/E-ledger.India.git

REM Push to the remote repository
git branch -M main
git push -u origin main

echo Repository setup and pushed successfully!
pause