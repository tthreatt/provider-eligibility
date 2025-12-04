import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <SignUp
        signInUrl="/sign-in"
        fallbackRedirectUrl="/"
        routing="path"
      />
    </div>
  );
}
