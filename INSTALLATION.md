# UnitView Windows - Installation Guide

## Quick Start

### Option 1: Download Installer (Recommended)
1. Download `UnitView-Setup-1.0.0.exe` from the releases page
2. Run the installer as Administrator
3. Follow the installation wizard
4. Launch UnitView from desktop shortcut or Start menu

### Option 2: Build from Source
1. Install Node.js 18+ from https://nodejs.org/
2. Clone this repository
3. Navigate to the `unitview-windows` directory
4. Run `build.bat` (Windows) or follow manual steps below

## Manual Build Instructions

### Prerequisites
- Node.js 18 or higher
- npm (comes with Node.js)
- Windows 10/11
- Git (for cloning repository)

### Step 1: Download Source Code
```bash
git clone https://github.com/Linearthrone/unitview.git
cd unitview/unitview-windows
```

### Step 2: Install Dependencies
```bash
npm install
npm run postinstall
```

### Step 3: Development Mode (Optional)
```bash
npm run dev
```
This will start the app in development mode with hot reload.

### Step 4: Build for Production
```bash
npm run build:all
```

### Step 5: Install Application
The installer will be created in the `release/` directory:
- Navigate to `release/`
- Run `UnitView Setup 1.0.0.exe`
- Follow installation prompts

## System Requirements

### Minimum Requirements
- **OS:** Windows 10 (version 1903) or later
- **Architecture:** x64 (64-bit)
- **RAM:** 4 GB
- **Storage:** 500 MB available space
- **Processor:** Intel Core i3 or equivalent

### Recommended Requirements
- **OS:** Windows 11
- **Architecture:** x64 (64-bit)
- **RAM:** 8 GB or more
- **Storage:** 1 GB available space
- **Processor:** Intel Core i5 or equivalent

## Installation Verification

### Check Installation
1. Open Start Menu and search for "UnitView"
2. Launch the application
3. You should see the UnitView dashboard with the default "North-South View" layout

### Verify Data Persistence
1. Create a test patient or staff member
2. Close and reopen the application
3. Verify that your changes were saved

## Troubleshooting

### Installation Issues

**"Windows protected your PC" warning**
- Click "More info" then "Run anyway"
- This is normal for unsigned applications

**"Node.js not found" error**
- Download and install Node.js from https://nodejs.org/
- Restart your computer after installation

**"Access denied" during installation**
- Right-click installer and "Run as administrator"
- Check that you have permissions to install programs

### Runtime Issues

**Application won't start**
1. Check Windows Event Viewer for error messages
2. Verify .NET Framework is installed (Windows 10+ includes it)
3. Try running as administrator

**Data not saving**
1. Check disk space availability
2. Verify write permissions to AppData folder
3. Restart the application

**Missing layouts or patients**
1. Check that the database file exists at `%APPDATA%\unitview-windows\unitview.db`
2. Try importing data from backup
3. Reset to defaults by deleting the database file and restarting

### Performance Issues

**Slow startup**
- Close unnecessary applications
- Check available disk space
- Consider upgrading to SSD storage

**Lag when dragging patients**
- Restart the application
- Check system memory usage
- Reduce the number of open applications

## Data Management

### Backup Your Data
1. Go to **File → Export Data** in UnitView
2. Choose a location to save the backup JSON file
3. Store backups in a safe location

### Restore Data
1. Go to **File → Import Data** in UnitView
2. Select your backup JSON file
3. Confirm the import

### Database Location
Your data is stored at:
```
%APPDATA%\unitview-windows\unitview.db
```

To access this folder:
1. Press `Win + R`
2. Type `%APPDATA%\unitview-windows` and press Enter
3. The database file will be in this folder

## Uninstallation

### Standard Uninstall
1. Open "Apps & Features" in Windows Settings
2. Search for "UnitView"
3. Click "Uninstall"
4. Follow the uninstallation wizard

### Manual Cleanup (optional)
1. Delete the application folder
2. Remove desktop shortcuts
3. Delete data folder: `%APPDATA%\unitview-windows`

**Note:** Deleting the data folder will remove all your layouts and patient data. Export your data before uninstalling if you want to keep it.

## Network Requirements

### Internet Connection
- **Optional:** Required only for initial download and updates
- **Offline:** Application works fully offline after installation

### Firewall Settings
No special firewall configuration is needed. The application does not:
- Connect to external servers
- Transfer data over the internet
- Require open ports

## Updates

### Automatic Updates (Future Versions)
- UnitView will check for updates on startup
- You'll be prompted to download and install updates

### Manual Updates
1. Download the latest installer from GitHub
2. Run the installer - it will update your existing installation
3. Your data will be preserved during the update

## Support

### Getting Help
1. Check this installation guide first
2. Review the main README.md file
3. Search existing GitHub issues
4. Create a new issue with:
   - Windows version
   - UnitView version
   - Detailed error description
   - Steps to reproduce

### Known Issues
- Some antivirus software may flag the app as unknown - this is normal
- Large datasets may cause occasional lag (optimize by archiving old layouts)
- Windows Defender SmartScreen may show warning - click "More info" → "Run anyway"

## Security

### Data Privacy
- All data is stored locally on your computer
- No data is transmitted to external servers
- No telemetry or analytics are collected

### File Permissions
The application requires read/write permissions to:
- Application installation directory
- User AppData folder for data storage
- Temp directory for printing operations

These permissions are standard for desktop applications and are automatically handled during installation.