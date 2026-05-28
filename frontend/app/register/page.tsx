import { AuthForm } from "@/components/AuthForm";

type AuthPageProps = {
  searchParams?: {
    redirect?: string | string[];
  };
};

export default function RegisterPage({ searchParams }: AuthPageProps) {
  const redirectParam = searchParams?.redirect;
  const redirectTo = Array.isArray(redirectParam) ? redirectParam[0] : redirectParam;

  return <AuthForm mode="register" redirectTo={redirectTo} />;
}
