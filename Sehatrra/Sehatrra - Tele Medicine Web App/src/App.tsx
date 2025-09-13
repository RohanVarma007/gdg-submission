import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { ThemeToggle } from "./components/ThemeToggle";
import { Toaster } from "sonner";
import { PatientDashboard } from "./components/PatientDashboard";
import { DoctorDashboard } from "./components/DoctorDashboard";
import { ProfileSetup } from "./components/ProfileSetup";
import { AdminDashboard } from "./components/AdminDashboard";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <ThemeToggle />
      <header className="sticky top-0 z-40 glass-effect h-20 flex justify-between items-center px-6 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="pill-icon bg-gradient-to-br from-cyan-500 to-blue-600 float-animation">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full pulse-healthcare"></div>
          </div>
          <div>
            <h2 className="text-2xl font-bold gradient-text">
              Sehatrra
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Healthcare for Everyone</p>
          </div>
        </div>
        <Authenticated>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
              <div className="w-2 h-2 bg-green-500 rounded-full pulse-healthcare"></div>
              <span className="text-sm font-medium">Online</span>
            </div>
            <SignOutButton />
          </div>
        </Authenticated>
      </header>
      <main className="flex-1">
        <Content />
      </main>
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'glass-effect border-cyan-200 dark:border-cyan-800 rounded-2xl',
        }}
      />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const profile = useQuery(api.profiles.getCurrentProfile);

  if (loggedInUser === undefined || profile === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading your healthcare dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Unauthenticated>
        <div className="dashboard-container">
          <div className="max-w-md mx-auto mt-12">
            <div className="text-center mb-8 slide-in">
              <div className="mb-6">
                <div className="pill-icon-large bg-gradient-to-br from-cyan-500 to-blue-600 mx-auto mb-4 float-animation">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-5xl font-bold gradient-text mb-4">
                Rural Healthcare Platform
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 mb-2">
                Connect with doctors, find nearby services, and manage your health
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <span>Available in English, Hindi, and Punjabi</span>
              </div>
            </div>
            <div className="pill-card-large p-8">
              <SignInForm />
            </div>
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
        <div className="slide-in">
          {!profile ? (
            <ProfileSetup onComplete={() => window.location.reload()} />
          ) : profile.role === "patient" ? (
            <PatientDashboard />
          ) : profile.role === "doctor" ? (
            <DoctorDashboard />
          ) : profile.role === "admin" ? (
            <AdminDashboard />
          ) : (
            <div className="dashboard-container">
              <div className="pill-card-large p-8 text-center">
                <div className="pill-icon bg-gradient-to-br from-cyan-500 to-blue-600 mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Welcome to Sehatrra</h2>
                <p className="text-slate-600 dark:text-slate-400">Your role: <span className="font-semibold text-cyan-600">{profile.role}</span></p>
              </div>
            </div>
          )}
        </div>
      </Authenticated>
    </div>
  );
}
