# Personal Website Project

This README file provides step-by-step instructions to generate static pages, set up the local development environment, and serve the website locally. Follow the guide carefully to ensure smooth operation of the project.

---

## **Project Structure**

```
MyWebsite/
├── essays-markdowns/      # Markdown files for essays
├── essays/                # Generated static HTML files for essays
├── templates/             # Template HTML files
│   └── essay-template.html
├── data/                  # JSON metadata for essays
│   └── essays.json
├── css/                   # CSS stylesheets
│   └── styles.css
├── index.html             # Homepage
├── generate-pages.js      # Script to generate static pages
├── package.json           # NPM configuration
└── README.md              # Documentation
```

---

## **Typical Workflow**

Here's the recommended workflow for different development scenarios:

### **For Development with Live Reload:**
```bash
npm start
```
This starts the Vite dev server with hot module replacement and fast refresh.

### **For Building the Project:**
```bash
npm run build
```
This runs the full build process: TypeScript compilation + page generation.

### **For Continuous TypeScript Compilation During Development:**
```bash
npm run build:watch
```
This continuously compiles TypeScript files as you make changes.

### **For Building Essays Only (without TypeScript compilation):**
```bash
npm run build:essays
```
This generates essay pages without recompiling TypeScript.

### **For Building Essays in Watch Mode:**
```bash
npm run build:essays:watch
```
This restarts the essay generation script when files change.

---

## **Steps to Generate Static Pages**

1. **Ensure Prerequisites**:
    - Install [Node.js](https://nodejs.org/) (LTS version recommended).

2. **Install Dependencies**:
   Run the following command in the root directory of your project:
   ```bash
   npm install marked
   ```

3. **Add Markdown Files**:
   Place your essay Markdown files in the `essays-markdowns/` folder. Ensure each file has a unique name.

4. **Update Metadata**:
   Edit `data/essays.json` to include metadata for each essay. Example:
   ```json
   [
       {
           "filename": "example-essay.md",
           "title": "My First Essay",
           "date": "2024-01-01",
           "snippet": "This is a short summary of the essay..."
       },
       {
           "filename": "another-essay.md",
           "title": "Another Essay",
           "date": "2024-01-02",
           "snippet": "Here’s another snippet for the second essay..."
       }
   ]
   ```

5. **Update the Template**:
   Ensure the `templates/essay-template.html` file includes the desired layout and styles. For example, include the Space Grotesk font in the `<head>` section:
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
   ```

6. **Generate Essay Pages**:
   Run the `generate-pages.js` script to generate the essay HTML files:
   ```bash
   node generate-pages.js
   ```
   This will:
    - Convert Markdown files into HTML files stored in the `essays/` folder.


7. **Generate Index Pages**:
   Run the `generate-pages.js` script to generate and update `index.html`:
   ```bash
   node index-generator.js
   ```
   This will:
   - Update the `index.html` file with links to the generated essay pages.

---

## **Serving the Website Locally**

1. **Install Vite**:
   Vite is a fast development server for modern web projects. Install it as a development dependency:
   ```bash
   npm install vite --save-dev
   ```

2. **Update `package.json`**:
   Add a `dev` script to start the Vite server. Your `package.json` should include:
   ```json
   "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "build": "tsc && node index-generator.js",
    "build:watch": "tsc --watch",
    "start": "vite",
    "build:essays": "node index-generator.js",
    "build:essays:watch": "nodemon index-generator.js"
   },
   ```

3. **Start the Local Server**:
   Use the following command to start the development server:
   ```bash
   npm run start
   ```

4. **Access the Website**:
   Open the provided local URL (e.g., `http://localhost:5173`) in your browser to view the website.

## **Additional Notes**

- **File Locations**:
    - Place Markdown files in `essays-markdowns/`.
    - Generated HTML files will be stored in `essays/`.

- **CSS Styling**:
    - Ensure `css/styles.css` is correctly referenced in `index.html` and `essay-template.html`.

- **Regenerating Pages**:
    - If you add or edit Markdown files, update `essays.json` and rerun the `generate-pages.js` script.

---

## **Troubleshooting**

1. **Markdown Files Not Found**:
   Ensure the filenames in `essays.json` match the actual filenames in `essays-markdowns/`.

2. **Links Not Working**:
   Verify the `href` paths in `index.html` are correctly pointing to the `essays/` directory.

3. **Font Issues**:
   Confirm the Google Fonts link is included in the `<head>` of your template or HTML files.

---

This setup ensures a clean workflow for generating and maintaining your static website. If you encounter any issues, feel free to refine the scripts or structure as needed.

---
## **Credits**

Icons used on the website were sourced from https://feathericons.com/

