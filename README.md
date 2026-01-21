# N8N Contract Onboarding Form

A modern, multi-step onboarding form designed to streamline the contract generation process. Built with Vite, React, TypeScript, and shadcn/ui, this application provides a robust and user-friendly experience for collecting client and course information, culminating in a submission to an n8n webhook.

## ✨ Features

- **Multi-Step Interface**: Guides users through logical sections with a clear progress indicator.
- **Dynamic Form Logic**: Form steps adapt based on user input (e.g., showing "Company Details" only for business clients).
- **Robust Validation**: Real-time, client-side validation powered by `Zod` and `react-hook-form`, providing instant feedback.
- **Smart Defaults**: Intelligently pre-fills dates (e.g., contract end date, offer validity) to speed up data entry.
- **Complex Field Builders**:
    - **Lesson Packages**: Add multiple lesson types with custom pricing and hours.
    - **Schedule Builder**: A sophisticated interface to add recurring time slots with 15-minute precision and automatic overlap detection.
    - **Payment Plan**: An intuitive payment builder that helps manage installment amounts.
- **State Persistence**: Automatically saves form progress to `localStorage`, allowing users to resume where they left off (with a 15-minute timeout).
- **Responsive Design**: Clean and modern UI built with Tailwind CSS and `shadcn/ui`.
- **Submission Handling**: Submits the final, validated data to a configurable n8n webhook and displays a "Thank You" confirmation.

## 🛠️ Tech Stack

- **Framework**: React (with Vite)
- **Language**: TypeScript
- **UI**: shadcn/ui & Tailwind CSS
- **Form Management**: React Hook Form
- **Schema Validation**: Zod
- **Animations**: Framer Motion
- **Phone Input**: react-phone-number-input

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-repo/n8n-form-vite.git
    cd n8n-form-vite
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Environment Variables

Create a `.env.local` file in the root of the project and add your n8n webhook URL:

```
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-id
```

### Running the Development Server

To start the local development server, run:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Building for Production

To create a production-ready build, run:

```bash
npm run build
```

The optimized static files will be generated in the `dist/` directory.

## 📂 Project Structure

```
.
├── public/
├── src/
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── OnboardingForm.tsx  # Main form component and sub-components
│   │   └── ThankYouCard.tsx    # Confirmation card after submission
│   ├── hooks/
│   │   └── use-toast.ts
│   ├── lib/
│   │   ├── schema.ts           # Zod validation schema and helpers
│   │   └── utils.ts            # Utility functions (e.g., cn)
│   ├── App.tsx
│   └── main.tsx
├── .env.local                  # Environment variables (not committed)
├── package.json
└── README.md
```

## 📄 License

This project is licensed under the MIT License.

