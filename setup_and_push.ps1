Write-Host "Setting up Git and pushing to GitHub repository..."

# Change to the project directory
Set-Location -Path "c:\Users\infoo\Desktop\e-ledger.ind\e-ledger.proto"

# Initialize git repository
git init

# Add all files to the repository
git add .

# Create initial commit
git commit -m "Initial commit: E-Ledger system with Supabase authentication integration"

# Add the remote repository
git remote add origin https://github.com/Engineer-oam/E-ledger.India.git

# Push to the remote repository
git branch -M main
git push -u origin main

Write-Host "Repository setup and pushed successfully!"
Read-Host -Prompt "Press Enter to exit"