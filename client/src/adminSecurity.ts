export type SecretPresentation = {
  label: "Configured securely" | "Not configured";
  value: "";
  type: "password";
};

export function getSecretPresentation(secret: string | undefined | null): SecretPresentation {
  return {
    label: secret?.trim() ? "Configured securely" : "Not configured",
    value: "",
    type: "password",
  };
}
