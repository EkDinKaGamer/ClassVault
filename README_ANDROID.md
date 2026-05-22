
# ClassVault Android Build Guide

Since this environment is a Cloud IDE, you cannot run Android Studio directly here. Follow these steps to generate your APK on your own computer:

1. **Build the Web Code**:
   In the terminal here, run:
   ```bash
   npm run build:android
   ```
   *If this fails with an Internal Server Error, please inform me so I can fix the build collector.*

2. **Download the Source Code**: 
   Click the **Project Options** or **Export** button in the interface to download your project as a ZIP file.

3. **Prepare your Computer**:
   - Unzip the project folder.
   - Install **Node.js** (LTS version recommended).
   - Install **Android Studio**.

4. **Install Dependencies**:
   Open a terminal on your computer in the unzipped folder and run:
   ```bash
   npm install
   ```

5. **Open in Android Studio**:
   - Open Android Studio.
   - Select **Open** and navigate to your project folder.
   - Select the `android` folder specifically.

6. **Generate APK**:
   - Wait for the **Gradle sync** to finish.
   - Go to: **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
   - Once finished, click **Locate** in the notification to find `app-debug.apk`.
