# Mockup Image Setup Guide

## For Hammer Wallet Ledger Mockup

1. **Save the mockup image** you provided to:
   ```
   knowledgeweb/public/mockups/hybrid-wallet-sow.png
   ```

2. **File requirements:**
   - Format: PNG, JPG, or WebP
   - Name: `hybrid-wallet-sow.png` (chính xác)
   - Location: `public/mockups/` folder

3. **After saving the file:**
   ```powershell
   cd "c:\Users\Song Quyen\Website\knowledgeweb"
   npm run knowledge:sync
   npm run build
   cd ..
   git add .
   git commit -m "Add Hammer Wallet mockup image"
   git push
   ```

4. **Result:**
   - The mockup image will display on the Hammer Wallet Ledger entity page
   - Image appears before the text description
   - Responsive & formatted nicely

## Quick Save Steps:

1. Right-click on the mockup image in VS Code
2. Choose "Save Image As"
3. Save to: `knowledgeweb/public/mockups/hybrid-wallet-sow.png`
4. Done! Then run the commands above.

---

This will make the mockup image appear on https://knowledgeweb.vercel.app when you select Hammer Wallet Ledger entity.
