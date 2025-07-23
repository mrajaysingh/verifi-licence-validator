# 🔐 Verifi - License Management System

<div align="center">

[![Deploy with Vercel](https://vercel.com/button)](https://api.skybersupport.me)
[![Live Demo](https://img.shields.io/badge/LIVE-DEMO-brightgreen?style=for-the-badge)](https://api.skybersupport.me)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Made with Next.js](https://img.shields.io/badge/Made%20with-Next.js-000000?style=for-the-badge&logo=Next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io)

<br/>

![Verifi Dashboard](https://api.skybersupport.me/demo-dashboard.png)

</div>

## ✨ Features

- 🔒 **Secure Authentication**
  - Email & Password login with OTP verification
  - Secret key verification
  - Session management with auto-logout
  - Inactivity detection

- 📝 **License Management**
  - Create, view, and manage licenses
  - Auto-generate unique license keys
  - Set expiration dates
  - Track license status
  - Extend license validity

- 👤 **Admin Features**
  - Profile management
  - Setup page access control
  - IP tracking
  - Last login tracking
  - Profile photo upload

- 🎨 **Modern UI/UX**
  - Responsive design
  - Dark theme
  - Glassmorphism effects
  - Smooth animations
  - Toast notifications

- 🛡️ **Security**
  - HTTPS enforced
  - CSRF protection
  - Rate limiting
  - Secure headers
  - Password hashing
  - Session encryption

## 🚀 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Email**: [Nodemailer](https://nodemailer.com/)
- **UI Components**: 
  - [Headless UI](https://headlessui.dev/)
  - [Heroicons](https://heroicons.com/)
- **Deployment**: [Vercel](https://vercel.com)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/verifi.git
   cd verifi
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in your environment variables in `.env`

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

## 📝 Environment Variables

```env
DATABASE_URL="your-database-url"
SMTP_HOST="your-smtp-host"
SMTP_PORT=587
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"
MAIL_FROM="your-sender-email"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
```

## 🌟 Usage

1. **Initial Setup**
   - Visit `/setup` to create the first admin account
   - Set up your profile and secret key

2. **Login Process**
   - Enter email, password, and secret key
   - Verify with OTP sent to email
   - Session starts with inactivity monitoring

3. **License Management**
   - Create licenses with auto-generated keys
   - Set expiration dates
   - Monitor license status
   - Extend license validity

4. **Admin Controls**
   - Manage your profile
   - Control setup page access
   - View login history
   - Track IP addresses

## 🔒 Security Features

- **Authentication**
  - Multi-factor authentication with email OTP
  - Secret key verification
  - Session encryption
  - Automatic logout on inactivity

- **Data Protection**
  - Password hashing with bcrypt
  - HTTPS enforcement
  - CSRF protection
  - Secure headers
  - Rate limiting

- **Access Control**
  - Protected API routes
  - Role-based access
  - Session validation
  - IP tracking

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Demo

Try out the live demo at [api.skybersupport.me](https://api.skybersupport.me)

## 📧 Contact

For support or queries, please contact:
- Email: support@skybersupport.me
- Website: [skybersupport.me](https://skybersupport.me)

---

<div align="center">
  Made with ❤️ by SkyberSupport
  <br/>
  © 2024 SkyberSupport. All rights reserved.
</div>
