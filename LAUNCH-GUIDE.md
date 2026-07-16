# Kaamoo — Launch & Deployment Guide (React + Vite)

Welcome to your newly modernized, component-based Kaamoo platform! We have migrated the website from a single-page monolithic HTML file to a professional, flexible React + Vite application.

---

## 🛠️ Folder Structure & Flexibility

Your code is now modularized exactly like modern platforms (Facebook, Airbnb, etc.). If you want to change any component, you only edit that specific file:

- **`src/data/config.js`**: Central configuration file. Update your WhatsApp phone number, location text, email address, or admin password here in seconds without touching any HTML.
- **`src/data/servicesData.js`**: Contains your full list of services and categories. Add, delete, or rename any service card here, and the changes will instantly sync across the catalog search, hero quick-selects, and bookings!
- **`src/firebase.js`**: Paste your Firebase config object here to connect your app to the cloud database.
- **`src/pages/`**: Individual page containers (`Home.jsx`, `Services.jsx`, `Booking.jsx`, `Careers.jsx`, `About.jsx`, `Contact.jsx`, `Admin.jsx`).
- **`src/components/`**: Reusable parts (`Navbar.jsx`, `Footer.jsx`, `FAQ.jsx`, `FloatingContact.jsx`, `Hero.jsx`, etc.).

---

## 🚀 Running Locally

1. **Install Dependencies**:
   If not already done, run:
   ```bash
   npm install
   ```
2. **Start Dev Server**:
   Run the following command to boot up the local dev environment:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 🔗 Connecting to Firebase Cloud Database

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add Project** and name it `kaamoo`.
3. Add a **Web App** (`</>`) named `kaamoo-web`.
4. Copy the `firebaseConfig` object shown on your screen.
5. Open `src/firebase.js` and replace the placeholder values with your config:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```
6. In your Firebase console side menu:
   - Go to **Firestore Database** → Click **Create Database**.
   - Select **Start in Test Mode** (allows client read/write).
   - Set location nearest to India (e.g., `asia-south1`).
7. Save the files. The app will automatically connect to Firebase!

---

## ☁️ Deploying to Vercel (100% Free)

Vercel provides free, high-performance hosting with automatic deployments from GitHub.

### Option 1: Import via Vercel Dashboard (Recommended)
1. Push your code to a GitHub repository.
2. Sign up/Log in to [Vercel](https://vercel.com/) (select "Continue with GitHub").
3. Click **Add New** → **Project**.
4. Import your `kaamoo-website` repository.
5. Vercel will auto-detect **Vite** as the framework.
6. Click **Deploy**. In under a minute, your website will be live on a free `yourproject.vercel.app` domain!

### Option 2: Deploy via Vercel CLI
If you want to deploy directly from your command line:
1. Run `npm install -g vercel`.
2. Run `vercel` in the project root directory.
3. Follow the CLI prompts to log in and deploy.

---

## 📦 Production Builds

To compile and bundle the site manually:
```bash
npm run build
```
This generates optimized static HTML/CSS/JS assets inside the `/dist` folder.

---

## 📊 Syncing to Google Sheets (100% Free Database Mirror)

You can automatically mirror all customer bookings, worker applications, and contact messages in a Google Spreadsheet. This lets you view and manage details on your phone!

### Step 1: Create a Google Sheet
1. Go to [Google Sheets](https://sheets.google.com) and create a new **Blank Spreadsheet**.
2. Name it `Kaamoo Database`.

### Step 2: Open Apps Script
1. In the top menu, click **Extensions** ➔ **Apps Script**.
2. Delete any default code in `Code.gs` and paste the following script:

```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheetName = "";
    
    if (data.type === "booking") {
      sheetName = "Bookings";
    } else if (data.type === "worker") {
      sheetName = "Workers";
    } else if (data.type === "message") {
      sheetName = "Messages";
    } else {
      return ContentService.createTextOutput("Unknown type");
    }
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // Add Headers
      if (data.type === "booking") {
        sheet.appendRow(["Ref", "Name", "Mobile", "Service", "Date", "Time", "Address", "Payment Pref", "Status", "Cost", "Created At"]);
      } else if (data.type === "worker") {
        sheet.appendRow(["ID", "Name", "Mobile", "Skill", "Rate", "Experience", "Area", "Hours", "Aadhar", "UPI", "Status", "Joined At"]);
      } else if (data.type === "message") {
        sheet.appendRow(["Name", "Mobile", "Email", "Subject", "Message", "Created At"]);
      }
    }
    
    // Append Data
    if (data.type === "booking") {
      sheet.appendRow([data.ref, data.name, data.mobile, data.service, data.reqDate, data.time, data.address, data.paymentPreference, data.status, data.totalCost, data.createdAt]);
    } else if (data.type === "worker") {
      sheet.appendRow([data.id, data.name, data.mobile, data.skill, data.rate, data.experience, data.area, data.hours, data.aadhar, data.upi, data.status, data.joinDate]);
    } else if (data.type === "message") {
      sheet.appendRow([data.name, data.mobile, data.email, data.subject, data.message, data.createdAt]);
    }
    
    return ContentService.createTextOutput("Success");
  } catch (error) {
    return ContentService.createTextOutput("Error: " + error.toString());
  }
}
```

### Step 3: Deploy as Web App
1. Click **Save** (disk icon).
2. Click **Deploy** (top-right button) ➔ **New deployment**.
3. Click the gear icon (Select type) ➔ **Web app**.
4. Set options:
   - **Description**: `Kaamoo Sync Webhook`
   - **Execute as**: `Me (your email)`
   - **Who has access**: `Anyone` (this allows your React app to send form data without logins)
5. Click **Deploy**.
6. Google will request permissions. Click **Authorize access**, select your Google account, click **Advanced** (under safety warning), and click **Go to Untitled project (unsafe)**. Allow permissions.
7. Copy the **Web App URL** shown (looks like `https://script.google.com/macros/s/XXXXX/exec`).

### Step 4: Add URL to Config
1. Open `src/data/config.js` and paste your copied URL into the `GOOGLE_SHEETS_URL` field:
   ```javascript
   GOOGLE_SHEETS_URL: 'https://script.google.com/macros/s/XXXXX/exec',
   ```
2. Save the file and deploy/push your code!
3. That's it! When a user books a service, registers as a worker, or contacts you, the Google Sheet will automatically generate tabs and append rows instantly.

