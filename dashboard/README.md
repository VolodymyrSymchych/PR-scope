# Project Scope Analyzer - Dashboard

A modern, AI-powered project scope analysis dashboard built with Next.js 14, TypeScript, and PostgreSQL.

## Features

- ✅ **User Authentication** - JWT-based auth with email verification
- ✅ **Project Management** - Create, analyze, and track projects
- ✅ **Friend System** - Connect with team members and send friend requests
- ✅ **Real-time Notifications** - Stay updated with project and friend activity
- ✅ **Team Collaboration** - Create teams and assign projects
- ✅ **Task Management** - Organize work with Kanban boards
- ✅ **AI-Powered Analysis** - Scope analysis using Claude AI
- ✅ **Payment Integration** - Stripe payment processing
- ✅ **Modern UI** - Glass morphism design with dark mode

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Authentication**: JWT (jose)
- **Email**: Resend + React Email
- **Payments**: Stripe
- **AI**: Anthropic Claude
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/VolodymyrSymchych/PR-scope.git
cd "Project Scope Analyzer/dashboard"
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration (see [AUTH_SETUP.md](./AUTH_SETUP.md) for details).

4. Run database migrations:
```bash
npx drizzle-kit generate:pg
npx drizzle-kit push:pg
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:5000](http://localhost:5000) in your browser

## Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://..."

# Authentication  
JWT_SECRET="your-secret-key"

# Email
RESEND_API_KEY="re_..."
EMAIL_FROM="Your App <noreply@yourdomain.com>"

# App
NEXT_PUBLIC_APP_URL="http://localhost:5000"

# Optional: AI Analysis
ANTHROPIC_API_KEY="sk-ant-..."

# Optional: Payments
STRIPE_SECRET_KEY="sk_..."
STRIPE_PUBLISHABLE_KEY="pk_..."
```

See `.env.example` for all available options.

## Project Structure

```
dashboard/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── friends/       # Friend request APIs
│   │   ├── notifications/ # Notification APIs
│   │   ├── projects/      # Project management
│   │   ├── tasks/         # Task management
│   │   └── teams/         # Team management
│   ├── sign-in/           # Sign in page
│   ├── sign-up/           # Sign up page
│   ├── verify/            # Email verification page
│   ├── friends/           # Friends management
│   ├── projects/          # Project pages
│   ├── dashboard/         # Main dashboard
│   └── ...
├── components/            # React components
│   ├── friends/           # Friend-related components
│   ├── notifications/     # Notification components
│   └── ...
├── lib/                   # Utilities and helpers
│   ├── auth.ts            # Auth utilities
│   ├── db.ts              # Database client
│   ├── email/             # Email templates
│   └── utils.ts           # General utilities
├── server/                # Server-side code
│   ├── db.ts              # Database connection
│   └── storage.ts         # Data access layer
├── shared/                # Shared code
│   └── schema.ts          # Drizzle schema
└── middleware.ts          # Route protection

```

## Database Schema

The application uses the following main tables:

- `users` - User accounts
- `email_verifications` - Email verification tokens
- `friendships` - Friend connections
- `teams` - Team/group information
- `team_members` - Team membership
- `projects` - Project data
- `team_projects` - Team-project relationships
- `payments` - Payment transactions
- `notifications` - User notifications

See `shared/schema.ts` for the complete schema.

## Authentication

The app uses JWT-based authentication with:

- Email/password sign up and sign in
- Email verification via Resend
- Protected routes via middleware
- Session management with httpOnly cookies
- OAuth support (Google, Microsoft) - pending configuration

See [AUTH_SETUP.md](./AUTH_SETUP.md) for detailed setup instructions.

## API Routes

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out
- `GET /api/auth/me` - Get current user
- `POST /api/auth/verify-email` - Verify email address

### Friends
- `GET /api/friends` - Get friends and pending requests
- `POST /api/friends` - Send friend request
- `POST /api/friends/[id]/accept` - Accept request
- `POST /api/friends/[id]/reject` - Reject request
- `DELETE /api/friends/[id]/remove` - Remove friend

### Notifications
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications/[id]/read` - Mark as read

### Projects
- `GET /api/projects` - Get user's projects
- `POST /api/projects` - Create project
- `GET /api/projects/[id]` - Get project details
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Teams
- `GET /api/teams` - Get user's teams
- `POST /api/teams` - Create team
- `GET /api/teams/[id]/members` - Get team members
- `POST /api/teams/[id]/members` - Add team member

## Development

### Running Tests
```bash
npm run test
```

### Linting
```bash
npm run lint
```

### Building for Production
```bash
npm run build
npm run start
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub

2. Import the project to Vercel

3. Set environment variables in Vercel dashboard

4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Railway
- Render
- AWS
- Google Cloud
- Azure

Make sure to:
1. Set all required environment variables
2. Run database migrations
3. Configure your domain/SSL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
- Open an issue on GitHub
- Check [AUTH_SETUP.md](./AUTH_SETUP.md) for authentication help
- Review the codebase documentation

## Roadmap

- [ ] Google OAuth integration
- [ ] Microsoft OAuth integration
- [ ] WebSocket support for real-time updates
- [ ] Advanced analytics dashboard
- [ ] Export reports to PDF
- [ ] Mobile app (React Native)

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Anthropic Claude](https://www.anthropic.com/)
- [Resend](https://resend.com/)
- [Stripe](https://stripe.com/)

