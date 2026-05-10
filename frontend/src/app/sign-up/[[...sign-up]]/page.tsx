import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";

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
          baseTheme: dark,
          variables: {
            colorBackground: "#111118",
            colorInputBackground: "#1a1a24",
            colorInputText: "#ffffff",
            colorText: "#ffffff",
            colorTextSecondary: "#9ca3af",
            colorPrimary: "#10b981",
            colorDanger: "#ef4444",
            borderRadius: "0.5rem",
          },
          elements: {
            card: {
              border: "1px solid #1e1e2e",
              boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
            },
            headerTitle: { color: "#ffffff" },
            headerSubtitle: { color: "#9ca3af" },
            socialButtonsBlockButton: {
              border: "1px solid #1e1e2e",
              backgroundColor: "#1a1a24",
              color: "#ffffff",
            },
            dividerLine: { backgroundColor: "#1e1e2e" },
            dividerText: { color: "#6b7280" },
            formFieldLabel: { color: "#d1d5db" },
            formFieldInput: {
              backgroundColor: "#1a1a24",
              border: "1px solid #1e1e2e",
              color: "#ffffff",
            },
            formButtonPrimary: {
              backgroundColor: "#10b981",
              color: "#ffffff",
            },
            footerActionLink: { color: "#10b981" },
          },
        }}
      />
    </div>
  );
}
