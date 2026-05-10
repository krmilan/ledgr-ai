import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#0a0a0f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <SignUp
        appearance={{
          elements: {
            card: "bg-[#111118] border border-[#1e1e2e]",
            headerTitle: "text-white",
            headerSubtitle: "text-gray-400",
            formButtonPrimary: "bg-emerald-500 hover:bg-emerald-600",
            footerActionLink: "text-emerald-500",
            formFieldInput: "bg-[#1a1a24] border-[#1e1e2e] text-white",
            formFieldLabel: "text-gray-300",
          },
        }}
      />
    </div>
  );
}
