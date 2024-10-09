# **README**

## **Overview**

This **Next.js** application allows users to interact with their **Google Drive** files directly from the app. Users can:

- **Authenticate** using their Google account.
- **View** a list of their Google Drive files.
- **Upload** new files to Google Drive.
- **Delete** individual files or all files.
- **Sign Out** of the application.

The app leverages **Next.js** features like **API routes** and **dynamic routing**, along with **NextAuth.js** for authentication, and communicates with the **Google Drive API** to perform file operations.

---

## **Directory Structure**

The application is organized into several key directories and components:

- **/app/api**  
  Contains server-side API routes for authentication and Google Drive interactions.
  
- **/app/auth**  
  Handles user authentication pages and components.
  
- **/app/my-files**  
  Contains the main component for displaying and managing Google Drive files.

---

## **Running the Application**

### **Prerequisites**

Make sure the following are installed on your system:

- **Node.js**
- **npm** or **yarn** (package manager for dependencies)

### **Setup Steps**

### **Install dependencies**
``` npm i```


### **Add enviroment variables**
(To get these keys use google console to create an OAuth client with the following scopes)
- /auth/drive.file
- /auth/drive.appdata
- /auth/userinfo.profile
- /auth/userinfo.email

(Generate NEXTAUTH_SECRET using `openssl rand -base64 32`)
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_SECRET=your-nextauth-secret
```

### **Run Development Server**
```npm run dev```

### **Run Tests**
```npm run test```