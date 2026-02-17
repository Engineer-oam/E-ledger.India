# Script to verify the git push
Write-Host "Verifying Git repository status..."

# Change to the project directory
Set-Location -Path "c:\Users\infoo\Desktop\e-ledger.ind\e-ledger.proto"

# Check current status
Write-Host "Current Git status:"
git status

# Check commit history
Write-Host "`nCommit history:"
git log --oneline -10

# Check remote repositories
Write-Host "`nRemote repositories:"
git remote -v

# Try to fetch from remote to verify connection
Write-Host "`nFetching from remote..."
git fetch origin

# Check if local and remote branches are in sync
Write-Host "`nBranch status:"
git branch -v

Write-Host "`nVerification complete!"