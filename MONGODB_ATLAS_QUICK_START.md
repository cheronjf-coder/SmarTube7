# MongoDB Atlas Quick Start Guide for SmarTube

## 5-Minute Setup

### Step 1: Create Account (1 min)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up with Google (fastest)
3. Verify email

### Step 2: Create Free Cluster (2 min)

1. Click **"Build a Database"**
2. Select **M0 FREE** (Shared)
3. Provider: **AWS**
4. Region: **us-east-1** (or closest)
5. Cluster Name: `smartube`
6. Click **Create**

### Step 3: Create Database User (1 min)

1. Left sidebar → **Database Access**
2. Click **"Add New Database User"**
3. Username: `smartube_admin`
4. Password: Click **Autogenerate** (SAVE THIS!)
5. Privileges: **Read and write to any database**
6. Click **Add User**

### Step 4: Allow Network Access (30 sec)

1. Left sidebar → **Network Access**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"**
4. Confirm

### Step 5: Get Connection String (30 sec)

1. Left sidebar → **Database**
2. Click **Connect** on your cluster
3. Select **"Connect your application"**
4. Copy the string
5. Replace `<password>` with your password
6. Add `/smartube_db` before the `?`

### Your Final Connection String

```
mongodb+srv://smartube_admin:YOUR_PASSWORD@smartube.xxxxx.mongodb.net/smartube_db?retryWrites=true&w=majority
```

---

## Share With Me

Provide your complete connection string (with password replaced).

---

## Free Tier Limits

- **512 MB** storage
- **100 connections** max
- Shared cluster (slower)
- No dedicated support

This is plenty for a personal app with ~1000+ users!
