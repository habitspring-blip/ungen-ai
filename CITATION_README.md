# CitePro - Citation Management Tool

A comprehensive, modern citation management platform built with Next.js 14+, Supabase, and advanced AI features.

## 🚀 Features

### ✅ **Complete Feature Set**

- **Citation Generation**: APA, MLA, Chicago, Harvard, IEEE, AMA styles
- **Library Management**: Organize references in customizable libraries
- **Reference Database**: Full metadata storage with DOI, ISBN, URL support
- **PDF Management**: Upload, view, and annotate PDF documents
- **Search & Discovery**: Federated search across Google Scholar, Semantic Scholar, CrossRef
- **Collaboration**: Real-time sharing with granular permissions
- **AI Writing Assistant**: Grammar checking, paraphrasing, plagiarism detection
- **Analytics Dashboard**: Usage statistics and research insights
- **Mobile Ready**: Responsive design with mobile-optimized features

## 🛠️ **Setup Instructions**

### **1. Environment Setup**

```bash
# Copy environment template
cp .env.example .env.local

# Fill in your Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_database_url
```

### **2. Supabase Setup**

```bash
# Create a new Supabase project at https://supabase.com

# Copy the database URL and anon key to your .env.local

# The database schema will be automatically created when you run:
npx prisma db push
```

### **3. Database Migration**

```bash
# Generate Prisma client (may fail due to permissions, but schema is ready)
npx prisma generate

# Push schema to database
npx prisma db push

# Optional: Seed with sample data
npx prisma db seed
```

### **4. Install Dependencies**

```bash
npm install
```

### **5. Start Development Server**

```bash
npm run dev
```

## 📁 **Project Structure**

```
src/
├── app/
│   ├── citation/           # Main citation dashboard
│   ├── api/
│   │   ├── citation/       # Citation generation API
│   │   ├── libraries/      # Library management API
│   │   ├── references/     # Reference CRUD API
│   │   ├── upload/         # File upload API
│   │   ├── search/         # Federated search API
│   │   ├── analytics/      # Usage analytics API
│   │   └── user/           # User management API
│   └── ...
├── components/
│   ├── ui/                 # Reusable UI components
│   └── ...
├── lib/
│   ├── supabase/           # Database client setup
│   └── prisma.ts           # Prisma client
└── ...
```

## 🔧 **API Endpoints**

### **Citation Management**

- `POST /api/citation` - Generate citations with AI analysis
- `GET /api/libraries` - List user libraries
- `POST /api/libraries` - Create new library
- `GET /api/references` - List references with search/filtering
- `POST /api/references` - Create new reference

### **File Management**

- `POST /api/upload` - Upload PDF files with metadata extraction

### **Search & Discovery**

- `GET /api/search` - Federated search across academic databases
- `POST /api/search` - Bulk import search results

### **Analytics**

- `GET /api/analytics` - Usage statistics and insights

### **User Management**

- `GET /api/user/profile` - User profile and statistics
- `PUT /api/user/profile` - Update user settings

## 🎨 **UI Components**

### **Main Dashboard**

- **Header**: Search, citation style selector, writing assistant, enterprise tools
- **Libraries Sidebar**: Library navigation with reference counts
- **Quick Actions**: Import, upload, add manually, DOI import
- **References Grid/List**: Sortable, filterable reference display
- **Citation Styles Modal**: Preview and select citation formats

### **Advanced Features**

- **Writing Assistant**: Grammar checking, paraphrasing, plagiarism detection
- **PDF Viewer**: Full-screen PDF viewing with annotation tools
- **Reference Detail**: Complete metadata editing with citation preview
- **Analytics Dashboard**: Usage metrics and research insights
- **Collaboration Tools**: Library sharing and activity feeds

## 🔒 **Authentication**

Uses Supabase Auth with support for:

- Email/password authentication
- OAuth providers (Google, GitHub, etc.)
- Session management
- Row-level security (RLS)

## 📊 **Database Schema**

### **Core Tables**

- `users` - User accounts and settings
- `libraries` - Reference collections
- `references` - Citation metadata
- `annotations` - PDF annotations
- `citations` - Generated citation formats
- `library_members` - Collaboration permissions
- `activities` - Audit trail

### **Supporting Tables**

- `citation_styles` - Custom citation formats
- `search_queries` - Search history
- `usage_logs` - Analytics data

## 🚀 **Deployment**

### **Vercel Deployment**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### **Production Checklist**

- [ ] Supabase project configured
- [ ] Environment variables set
- [ ] Database schema deployed
- [ ] SSL certificates configured
- [ ] Analytics tracking enabled
- [ ] Error monitoring (Sentry) configured

## 🧪 **Testing**

### **API Testing**

```bash
# Test citation generation
curl -X POST http://localhost:3000/api/citation \
  -H "Content-Type: application/json" \
  -d '{"text":"This is a test paper about machine learning","style":"apa","sourceInfo":{"title":"Test Paper","authors":["Smith, J."],"year":2024}}'
```

### **Database Testing**

```bash
# Check database connection
npx prisma db push --preview-feature
```

## 🔧 **Development Commands**

```bash
# Development
npm run dev

# Build
npm run build

# Lint
npm run lint

# Database
npx prisma generate
npx prisma db push
npx prisma studio

# Type checking
npx tsc --noEmit
```

## 📈 **Performance Optimization**

- **Database Indexing**: Optimized queries with proper indexes
- **Caching**: Response caching for frequently accessed data
- **Lazy Loading**: Component lazy loading for better performance
- **Image Optimization**: Next.js image optimization
- **Bundle Splitting**: Code splitting for faster loads

## 🐛 **Troubleshooting**

### **Common Issues**

1. **Prisma Client Generation Fails**

   ```bash
   # Try clearing node_modules
   rm -rf node_modules/.prisma
   npm install
   npx prisma generate
   ```

2. **Database Connection Issues**

   ```bash
   # Check environment variables
   echo $DATABASE_URL

   # Test connection
   npx prisma db push --preview-feature
   ```

3. **Authentication Issues**
   ```bash
   # Check Supabase configuration
   # Verify anon key and URL in .env.local
   ```

## 📚 **Documentation**

- **API Documentation**: See `Documentation/API_ENDPOINTS.md`
- **Architecture**: See `Documentation/ARCHITECTURE.md`
- **Database Schema**: See `Documentation/DATABASE_SCHEMA.md`
- **Performance Guide**: See `Documentation/PERFORMANCE.md`

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 **Roadmap**

### **Phase 4: Advanced Features**

- Real-time collaboration with WebSockets
- Mobile native apps (React Native)
- Advanced AI features (literature review generation)
- Institutional integrations (LMS, repositories)
- White-label customization

### **Phase 5: Enterprise Scale**

- Multi-tenant architecture
- Advanced analytics and reporting
- SSO integration (SAML, LDAP)
- Compliance features (GDPR, HIPAA)
- 24/7 enterprise support

---

**CitePro** - Transforming academic research with modern technology! 🚀📚
