# Neuramance Website

## Environment Setup

### Using Vercel CLI for Environment Variables

You can easily download your environment variables from Vercel to a local `.env.local` file for development:

1. **Install the Vercel CLI globally:**

   ```bash
   bun add -g vercel
   ```

2. **Link your local project to Vercel:**
   Navigate to your project's root directory and link it to your Vercel project:

   ```bash
   vercel link
   ```

   Follow the prompts to connect your local project to your Vercel deployment.

3. **Pull the environment variables:**
   Download the development environment variables from Vercel:
   ```bash
   vercel env pull
   ```
   This creates or updates the `.env.local` file with variables from your Vercel project's Development environment.

**Notes:**

- If using `vercel dev`, environment variables are automatically downloaded into memory
- Always ensure `.env.local` is in your `.gitignore`
- Re-run `vercel env pull` after making changes to environment variables in Vercel dashboard
- Restart your development server after pulling new environment variables
- Use `NEXT_PUBLIC_` prefix for client-side accessible variables
