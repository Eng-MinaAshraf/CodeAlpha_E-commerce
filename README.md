# 🛒 E-Commerce Full-Stack Platform

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML/CSS](https://img.shields.io/badge/HTML5/CSS3-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

A comprehensive, full-stack E-commerce platform built with Node.js, Express.js, and Vanilla JavaScript. It integrates with **Supabase** for database management and authentication, and **ImgBB** for efficient image hosting. Designed with a robust API, role-based access control, and an elegant RTL (Arabic) user interface.

## 🔗 Live Demo
Visit the live application deployed on Vercel:
**[https://code-alpha-e-commerce-seven.vercel.app/](https://code-alpha-e-commerce-seven.vercel.app/)**

## 🌟 Overview
This project operates on a Client-Server architecture, serving an SPA-like frontend powered by ES modules and a RESTful backend API. Additionally, it features a **Serverless Mode** enabled by a client-side API Interceptor, allowing the frontend to run entirely independent of a backend server when deployed to static hosting platforms like Vercel.

## ✨ Features
- **Authentication & Authorization**: Secure signup, login, and user profile management using Supabase Auth (with Google OAuth support).
- **Product Catalog**: Dynamic product listings with search, category filtering, and sorting capabilities.
- **Cart & Checkout**: Interactive shopping cart and secure order placement system.
- **Order Management**: Customers can view order history and cancel pending orders.
- **Admin Dashboard**: Comprehensive control panel for viewing analytics, updating order statuses, managing products, and handling users.
- **Delivery System**: Dedicated portal and management endpoints for delivery staff to track and update assigned orders.
- **Responsive RTL Design**: Fully mobile-responsive interface optimized for Arabic content with a modern UI.
- **Dual Deployment Architecture**:
  - **Traditional Backend**: Node.js/Express.js server serving APIs and database operations.
  - **Serverless/Static Frontend**: Intercepts `/api/*` fetch requests directly in the browser and resolves them using Supabase client SDK.

## 🛠️ Tech Stack
- **Frontend**: HTML5, CSS3 (Custom Variables), Vanilla JavaScript (ES Modules).
- **Backend**: Node.js, Express.js.
- **Database & Auth**: Supabase (PostgreSQL).
- **Image Storage**: ImgBB API.
- **Security & Utilities**: Helmet, CORS, Morgan, Compression, Express-Validator, Multer.
- **Deployment**: Vercel (Frontend), Railway/Render (optional Backend).

## ⚡ Serverless Mode (Fetch Interceptor)
To support static web hosts (such as Vercel and Netlify) without deploying a separate Node.js server, the frontend includes a client-side **Fetch Interceptor** in `public/js/supabase.js`.
- It intercepts any request matching `/api/*`.
- Requests are handled client-side using direct calls to Supabase databases via the Supabase client SDK.
- This allows full backend functionality (like auth, products retrieval, cart actions, admin stats, and delivery assignments) directly in the browser.

## 📋 Requirements
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- npm or yarn
- A [Supabase](https://supabase.com/) Account (with Redirect URLs configured to support OAuth and local testing)
- An [ImgBB](https://api.imgbb.com/) API Key

## 🚀 Installation & Setup

1. **Clone the repository** (or navigate to the project directory):
   ```bash
   cd "E-commerce"
   ```

2. **Install backend dependencies** (if running the backend server):
   ```bash
   cd server
   npm install
   ```

3. **Configure Environment Variables**:
   Create or verify the `.env` file in the `server` directory with the following variables:
   ```env
   PORT=3000
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   IMGBB_API_KEY=your_imgbb_api_key
   NODE_ENV=development
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```

5. **Access the Application**:
   Open your browser and navigate to: `http://localhost:3000` (or open the `public/index.html` file using Live Server to run in Serverless Mode).

## 📁 Folder Structure
```text
.
├── server/                 # Backend Node.js Environment (Express server)
│   ├── config/             # Supabase & other configurations
│   ├── middleware/         # Auth, validation, and error handling
│   ├── routes/             # Express API routes (auth, products, admin, etc.)
│   ├── server.js           # Application entry point
│   └── package.json        # Backend dependencies
├── public/                 # Frontend Static Files
│   ├── css/                # Stylesheets (base, layout, components)
│   ├── js/                 # Client-side scripts (api.js, supabase.js, cart.js, etc.)
│   ├── pages/              # HTML views (cart, checkout, admin, delivery)
│   └── index.html          # Main landing page
└── assets/                 # Local assets & icons
```

## 🔌 API Reference (Selected Endpoints)

| Endpoint | Method | Description | Access |
|---|---|---|---|
| `/api/auth/profile` | GET / POST | Fetch or create user profile | Authenticated |
| `/api/products` | GET | Fetch products (supports pagination, filtering) | Public |
| `/api/products` | POST | Add a new product | Admin |
| `/api/cart` | GET / POST | View or add items to cart | Authenticated |
| `/api/orders` | POST | Place a new order | Authenticated |
| `/api/admin/stats` | GET | Retrieve overall platform statistics | Admin |
| `/api/admin/delivery`| POST | Create a new delivery staff account | Admin |

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!
Feel free to open an issue or submit a pull request if you want to contribute to the project.

## 📄 License
This project is licensed under the MIT License.
