import { AuthForm } from "@/components/AuthForm";

type AuthPageProps = {
  searchParams?: {
    redirect?: string | string[];
  };
};

export default function LoginPage({ searchParams }: AuthPageProps) {
  const redirectParam = searchParams?.redirect;
  const redirectTo = Array.isArray(redirectParam) ? redirectParam[0] : redirectParam;

  return <AuthForm mode="login" redirectTo={redirectTo} />;
}
