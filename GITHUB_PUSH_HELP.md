# 🔐 Push to GitHub - Authentication Required

Your repository is ready, but we need to authenticate to push. Here are your options:

---

## Option 1: Personal Access Token (Recommended)

### Step 1: Create GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. **Note**: "CRM Recorder Push Access"
4. **Expiration**: 90 days (or as needed)
5. **Select scopes**:
   - ✅ `repo` (Full control of private repositories)
6. Click "Generate token"
7. **⚠️ COPY THE TOKEN** - You won't see it again!

### Step 2: Configure Git Credentials

Run this in Emergent (replace YOUR_TOKEN with the token you copied):

```bash
cd /app/frontend

# Set up credential helper
git config --global credential.helper store

# Push with authentication
git push https://YOUR_GITHUB_USERNAME:YOUR_TOKEN@github.com/metacryptonex-pvtltd/crm-recorder.git main
```

**Example:**
```bash
git push https://username:ghp_xxxxxxxxxxxx@github.com/metacryptonex-pvtltd/crm-recorder.git main
```

---

## Option 2: Use SSH Key (More Secure)

### Step 1: Generate SSH Key in Emergent
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
# Press Enter for all prompts (use default location)

# Display your public key
cat ~/.ssh/id_ed25519.pub
```

### Step 2: Add SSH Key to GitHub
1. Copy the public key output
2. Go to: https://github.com/settings/keys
3. Click "New SSH key"
4. Paste your key and save

### Step 3: Change Remote and Push
```bash
cd /app/frontend
git remote set-url origin git@github.com:metacryptonex-pvtltd/crm-recorder.git
git push -u origin main
```

---

## Option 3: Manual Upload (If Above Fails)

### Download as ZIP
```bash
# Create a clean package without node_modules
cd /app
zip -r crm-recorder-source.zip frontend/ \
  -x "frontend/node_modules/*" \
  -x "frontend/.expo/*" \
  -x "frontend/.git/*"
```

### Then:
1. Download the ZIP somehow (if Emergent allows)
2. Extract on your computer
3. Push from your local machine:
```bash
cd crm-recorder-source/frontend
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/metacryptonex-pvtltd/crm-recorder.git
git push -u origin main
```

---

## 🎯 Which Method Do You Prefer?

**Tell me:**
1. **"I have a token"** - Then share it (in a secure way) and I'll push for you
2. **"Use SSH"** - I'll generate an SSH key and show you how to add it
3. **"I'll push from my computer"** - I'll help you get the files

Let me know which option works best! 🚀
