# HEIRAZA - Official Musician Website

A dynamic musician website built with Next.js 14, Tailwind CSS, and Prisma ORM with MySQL.

## 🎵 Features

- **Modern Design**: Minimalist, bold typography with high-contrast aesthetics
- **CMS Dashboard**: Admin panel to manage content
- **Events Management**: Create and manage tour dates
- **Merch Shop**: Product listings with external purchase links
- **Newsletter**: Email subscription system
- **Responsive**: Fully optimized for all devices

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Shadcn UI
- **Database**: MySQL via Prisma ORM
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MySQL Server running on localhost:3306
- Database named `heiraza_db` created

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Push the database schema:**
   ```bash
   npx prisma db push
   ```

3. **Seed the database with sample data:**
   ```bash
   npm run db:seed
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Database Commands

```bash
# Push schema changes to database
npm run db:push

# Seed database with sample data
npm run db:seed

# Open Prisma Studio (visual database editor)
npm run db:studio
```

## 📁 Project Structure

```
HeirazaWeb/
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Seed data script
├── src/
│   ├── app/
│   │   ├── admin/       # Admin dashboard
│   │   ├── api/         # API routes
│   │   ├── globals.css  # Global styles
│   │   ├── layout.tsx   # Root layout
│   │   └── page.tsx     # Home page
│   ├── components/      # Reusable components
│   └── lib/
│       ├── prisma.ts    # Prisma client
│       └── utils.ts     # Utility functions
├── .env                 # Environment variables
└── package.json
```

## 🔐 Admin Access

Navigate to `/admin` to access the dashboard.

**Default admin credentials (from seed):**
- Username: `admin`
- Password: `heiraza2025`

> ⚠️ In production, implement proper authentication with hashed passwords!

## 📝 Environment Variables

```env
DATABASE_URL="mysql://root:1234@localhost:3306/heiraza_db"
```

## 🎨 Customization

- **Colors**: Edit CSS variables in `src/app/globals.css`
- **Fonts**: Update font imports in `globals.css`
- **Content**: Use the admin dashboard or modify `prisma/seed.ts`

---

Built with ❤️ for Heiraza
