# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/0909e254-490d-4016-8416-e92073c6a124

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/0909e254-490d-4016-8416-e92073c6a124) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Solana Wallet Integration (Optional Feature)

RezLit includes optional Solana wallet sign-in that provides premium access through token ownership instead of paid subscriptions.

### Setup

1. Copy `.env.example` to `.env` and configure the Solana variables:
   ```
   SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
   REZLIT_TOKEN_MINT="your_token_mint_address"
   REZLIT_SEEKER_MIN="10000"
   REZLIT_EMPLOYER_MIN="100000"
   ```

2. Replace `REZLIT_TOKEN_MINT` with your actual SPL token contract address
3. Adjust minimum token requirements as needed

### How it works

- **Job Seekers**: Hold minimum 10,000 tokens for premium features
- **Employers**: Hold minimum 100,000 tokens for premium features  
- **Token verification**: Happens server-side via Supabase Edge Functions
- **Wallet support**: Compatible with Phantom, Solflare, and other Solana wallets
- **Fallback**: Email/password + Stripe subscriptions remain fully functional

### Security

- Token balances are verified server-side only
- RPC endpoints and sensitive data never exposed to client
- Wallet connection is separate from premium verification

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/0909e254-490d-4016-8416-e92073c6a124) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
