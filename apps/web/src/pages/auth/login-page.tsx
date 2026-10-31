import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { createLoginSchema, type LoginDto } from "@riskatlas/shared/auth";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app as firebaseApp } from "@/lib/firebase";
import { cn } from "cn";
import { FirebaseError } from "firebase/app";
import { handleFirebaseError } from "@/error/handle-firebase-error";
import { useDispatch } from "react-redux";
import { setIsLoggedIn } from "@store/auth/slice/auth-slice";
import { toast } from "sonner";
import { flash } from "@/lib/camera-flash-effect";
import { sleep } from "@/lib/sleep";

const loginSchema = createLoginSchema().shape.body;

type FormInput = "email" | "password";
type FormValues = Record<FormInput, string>;
type FormErrors = Partial<Record<FormInput, string>>;

const initialValues: FormValues = {
  email: "",
  password: "",
};

function toDto(values: FormValues): Record<string, string | undefined> {
  return {
    email: values.email.trim(),
    password: values.password,
  };
}

function validate(values: FormValues) {
  const result = loginSchema.safeParse(toDto(values));
  if (result.success) return { data: result.data, errors: {} };

  const errors: FormErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof LoginDto;
    errors[key] ??= issue.message;
  }
  return { data: null, errors };
}

export default function LoginPage() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [serverErrors, setServerErrors] = useState<
    { message: string }[] | null
  >(null);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const dispatch = useDispatch();

  const handleChange =
    (field: FormInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = { ...values, [field]: e.target.value };
      setValues(next);
      if (submitted) setFormErrors(validate(next).errors);
    };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setServerErrors(null);
      setSubmitted(true);
      setIsLoading(true);

      const { data, errors } = validate(values);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      if (!data?.email) {
        setFormErrors({ ...errors, email: "Email is required" });
        return;
      }

      const auth = getAuth(firebaseApp);
      const authResult = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      );

      console.log(authResult);
      dispatch(setIsLoggedIn(true));
      toast.success("Successfully signed in", {
        position: "top-right",
        duration: 5000,
      });
      flash({
        initialOpacity: 1,
        finalOpacity: 0.4,
        duration: 800,
      }).then(async () => {
        await sleep(800);
        navigate("/");
      });
    } catch (error) {
      let message = "";
      if (error instanceof FirebaseError) {
        message = handleFirebaseError(error);
      } else {
        message = "An unknown error occurred";
      }

      toast.error(message, { position: "top-right" });

      setServerErrors((prev) => [...(prev ?? []), { message }]);
    } finally {
      setIsLoading(false);
    }

    console.log(values);
  }

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <Card className="w-full max-w-sm bg-background/80 backdrop-blur-md border border-primary shadow-[0_0_40px_-8px_var(--color-primary)]">
        <CardHeader>
          <CardTitle className="text-xl">Sign in</CardTitle>
          <CardDescription>
            Sign in to RiskAtlas to explore and track risk on the map.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} noValidate>
          <CardContent>
            <FieldGroup>
              {serverErrors?.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertTitle>{error.message}</AlertTitle>
                </Alert>
              ))}

              <Field data-invalid={!!formErrors.email}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="jane@example.com"
                  value={values.email}
                  onChange={handleChange("email")}
                  aria-invalid={!!formErrors.email}
                  className="border border-primary"
                />
                <FieldError>{formErrors.email}</FieldError>
              </Field>

              <Field data-invalid={!!formErrors.password}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={values.password}
                    onChange={handleChange("password")}
                    aria-invalid={!!formErrors.password}
                    className="pr-9 border border-primary"
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-1/2 right-0.5 -translate-y-1/2"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </Button>
                </div>

                {formErrors.password ? (
                  <FieldError>{formErrors.password}</FieldError>
                ) : (
                  <FieldDescription>At least 8 characters.</FieldDescription>
                )}
              </Field>
            </FieldGroup>
          </CardContent>

          <CardFooter className="mt-6 flex-col gap-3">
            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={isLoading}
            >
              {isLoading && <Spinner />}
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/auth/register"
                className={cn(
                  "font-medium text-foreground underline-offset-4 hover:underline select-none",
                  isLoading && "pointer-events-none opacity-50",
                )}
                onClick={(e) => {
                  if (isLoading) {
                    e.preventDefault();
                  }
                }}
              >
                Register
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
