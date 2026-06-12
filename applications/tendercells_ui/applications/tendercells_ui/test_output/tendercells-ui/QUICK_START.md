# Quick Start Guide

Get up and running with TenderCells UI in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- npm 9+ installed

## Setup Steps

### Option 1: Automated Setup (Recommended)

```powershell
# Run the setup script
.\setup-dev.ps1
```

### Option 2: Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env

# 3. Start development server
npm run dev
```

## Verify Installation

1. **Check dependencies**:
   ```bash
   npm list --depth=0
   ```

2. **Run tests**:
   ```bash
   npm test -- --run
   ```

3. **Start dev server**:
   ```bash
   npm run dev
   ```

4. **Open browser**: Navigate to `http://localhost:5173`

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm test` | Run tests in watch mode |
| `npm run build` | Build for production |
| `npm run lint` | Check code quality |

## Troubleshooting

**Port in use?**
```bash
npm run dev -- --port 3000
```

**Dependencies issues?**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Tests failing?**
```bash
npm test -- --clearCache
npm test -- --run
```

## Next Steps

- Read [README.md](./README.md) for full documentation
- Check [DEVELOPMENT.md](./DEVELOPMENT.md) for development workflow
- See [INTEGRATION_TESTING.md](./INTEGRATION_TESTING.md) for service integration

## Need Help?

- Check the documentation files
- Review test examples in `src/__tests__/`
- Check component code for usage patterns




