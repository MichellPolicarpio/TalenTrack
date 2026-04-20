[ignoring loop detection]
# TalentTrack: Professional Resume Management System

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white) 
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) 
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) 
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Azure SQL](https://img.shields.io/badge/Azure_SQL-0089D6?style=for-the-badge&logo=microsoft-azure&logoColor=white)
![Azure Key Vault](https://img.shields.io/badge/Azure_Key_Vault-0078D4?style=for-the-badge&logo=microsoft-azure&logoColor=white)

---

## 📝 Project Overview

**TalentTrack** is a high-performance, enterprise-grade resume building and management platform. Designed with premium aesthetics and professional functionality in mind, it allows users to create multi-page, brand-consistent resumes with real-time editing and high-fidelity PDF exporting.

Built for **Brindley Engineering**, the system ensures that every technical project experience is documented accurately, maintaining confidentiality and professional standards.

### 👥 Core Leadership
- **Elaborated by**: Michell Policarpio (*Full Stack Developer*)
- **Directed by**: Victor Olvera (*Chemical Engineer*)

---

## 🚀 Key Features

- **Advanced Multi-Page Editor**: A dynamic physical page layout (`Letter` size) that mirrors the final PDF output.
- **High-Fidelity PDF Engine**: Custom-built export logic using `jsPDF` and `html2canvas-pro` for pixel-perfect resolution.
- **Enterprise Security**: Integration with **Azure Key Vault** and **NextAuth.js**.
- **Real-time Data Sync**: Immediate synchronization with **Azure SQL Database**.
- **Smart Form Validation**: Character limits and live counters for critical fields like Job Title and Summary.

---

## 🛠️ Technical Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4.0](https://tailwindcss.com/)
- **Database**: [Azure SQL Database](https://azure.microsoft.com/en-us/products/azure-sql/database/)
- **Security**: [@azure/keyvault-secrets](https://www.npmjs.com/package/@azure/keyvault-secrets) & [NextAuth.js](https://next-auth.js.org/)
- **Editor Mechanics**: [@dnd-kit](https://dndkit.com/) for reordering components.
- **PDF Core**: `jspdf` & `html2canvas-pro`.

---

## 📂 Project Structure

```text
app/
├── (dashboard)/        # Main application views (Resume Editor, History, Admin)
├── api/                # Backend API routes (PDF generation, Auth, Database)
├── layout.tsx          # Global layout and providers
components/
├── resume/             # Core Resume Builder components
├── ui/                 # Shadcn-based UI primitive components
├── layout/             # Navigation and dashboard shell
lib/
├── db.ts               # Azure SQL connection and patterns
├── pdf/                # PDF style definitions and rendering logic
├── actions/            # Server actions for data mutations
```

---

## 🌩️ Azure Integration

This project is fully integrated with the **Microsoft Azure Ecosystem**:
*   **Azure SQL Database**: Reliable relational storage for complex resume entities.
*   **Azure Key Vault**: Secure storage of database strings and secret tokens.
*   **Azure Identity**: Role-based access control for cloud resources.

---

## ⚙️ Getting Started

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your `.env` with Azure SQL and Key Vault credentials.
4. Run the development server:
   ```bash
   npm run dev
   ```

---

*Developed with ❤️ for Brindley Engineering.*
