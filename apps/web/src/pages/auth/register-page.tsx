import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { createUserSchema, type CreateUserDto } from "@riskatlas/shared/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

const registerSchema = createUserSchema().shape.body;

type FormInput = keyof CreateUserDto | "passwordAgain";

type FormValues = Record<FormInput, string>;
type FormErrors = Partial<Record<FormInput, string>>;

const initialValues: FormValues = {
  userName: "",
  email: "",
  password: "",
  phoneNumber: "",
  passwordAgain: "",
};

function toDto(values: FormValues): Record<string, string | undefined> {
  return {
    userName: values.userName.trim(),
    email: values.email.trim(),
    password: values.password,
    phoneNumber: values.phoneNumber.trim() || undefined,
  };
}

function validate(values: FormValues) {
  const result = registerSchema.safeParse(toDto(values));
  if (result.success) return { data: result.data, errors: {} };

  const errors: FormErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof CreateUserDto;
    errors[key] ??= issue.message;
  }
  return { data: null, errors };
}

export default function RegisterPage() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordAgain, setShowPasswordAgain] = useState(false);

  const handleChange =
    (field: FormInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = { ...values, [field]: e.target.value };
      setValues(next);
      if (submitted) setErrors(validate(next).errors);
    };

  async function handleSubmit() {
    setSubmitted(true);
  }

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <Card className="w-full max-w-sm bg-background/80 backdrop-blur-md border border-primary">
        <CardHeader>
          <CardTitle className="text-xl">Create an account</CardTitle>
          <CardDescription>
            Join RiskAtlas to explore and track risk on the map.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} noValidate>
          <CardContent>
            <FieldGroup>
              {/* {serverError && (
                <Alert variant="destructive">
                  <AlertTitle>{serverError.message}</AlertTitle>
                  {serverError.issues.length > 0 && (
                    <AlertDescription>
                      <ul className="list-inside list-disc">
                        {serverError.issues.map((issue) => (
                          <li key={issue}>{issue}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  )}
                </Alert>
              )} */}

              <Field data-invalid={!!errors.userName}>
                <FieldLabel htmlFor="userName">User name</FieldLabel>
                <Input
                  id="userName"
                  autoComplete="username"
                  placeholder="jane_doe"
                  value={values.userName}
                  onChange={handleChange("userName")}
                  aria-invalid={!!errors.userName}
                  className="border border-primary"
                />
                <FieldError>{errors.userName}</FieldError>
              </Field>

              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="jane@example.com"
                  value={values.email}
                  onChange={handleChange("email")}
                  aria-invalid={!!errors.email}
                  className="border border-primary"
                />
                <FieldError>{errors.email}</FieldError>
              </Field>

              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={values.password}
                    onChange={handleChange("password")}
                    aria-invalid={!!errors.password}
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

                {errors.password ? (
                  <FieldError>{errors.password}</FieldError>
                ) : (
                  <FieldDescription>At least 8 characters.</FieldDescription>
                )}
              </Field>

              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password">Password Again</FieldLabel>
                <div className="relative">
                  <Input
                    id="passwordAgain"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={values.passwordAgain}
                    onChange={handleChange("passwordAgain")}
                    aria-invalid={!!errors.passwordAgain}
                    className="pr-9 border border-primary"
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-1/2 right-0.5 -translate-y-1/2"
                    onClick={() => setShowPasswordAgain((v) => !v)}
                    aria-label={
                      showPasswordAgain ? "Hide password" : "Show password"
                    }
                  >
                    {showPasswordAgain ? <EyeOffIcon /> : <EyeIcon />}
                  </Button>
                </div>

                {errors.passwordAgain && (
                  <FieldError>{errors.passwordAgain}</FieldError>
                )}
              </Field>

              <Field data-invalid={!!errors.phoneNumber}>
                <FieldLabel htmlFor="phoneNumber">
                  Phone number{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </FieldLabel>
                <Input
                  id="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+905551234567"
                  value={values.phoneNumber}
                  onChange={handleChange("phoneNumber")}
                  aria-invalid={!!errors.phoneNumber}
                  className="border border-primary"
                />
                <FieldError>{errors.phoneNumber}</FieldError>
              </Field>
            </FieldGroup>
          </CardContent>

          <CardFooter className="mt-6 flex-col gap-3">
            <Button type="submit" className="w-full cursor-pointer">
              {/* {pending && <Spinner />}
              {pending ? "Creating account..." : "Create account"} */}
              create account
            </Button>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/auth/login"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
