import { Request, Response, NextFunction, RequestHandler } from "express";
import { AppError } from "@core/errors/app-error.js";
import { HttpStatusCode } from "@riskatlas/shared";
import { MachineCode } from "@core/errors/machine-code.js";

export interface AuthenticatedRequest extends Request {
  auth?: {
    subject?: string;
    [key: string]: unknown;
  };
}

export type Predicate = (req: AuthenticatedRequest) => boolean;

export const isAuthenticated: Predicate = (req) => Boolean(req.auth?.subject);

export class SecurityError extends AppError {
  constructor(
    message: string,
    statusCode: HttpStatusCode,
    isOperational: boolean,
    code: MachineCode,
  ) {
    super(message, statusCode, isOperational, code);
  }
}

interface Rule {
  route: string;
  predicates: Predicate[];
}

export interface SecurityConfig {
  rules: Rule[];
  middlewares: RequestHandler[];
  defaultDeny?: boolean;
}

export class SecurityFilterChain {
  constructor(private readonly config: SecurityConfig) {}

  public getMiddleware(): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        await this.runMiddlewares(req, res);

        if (res.headersSent) {
          return;
        }

        const authReq = req as AuthenticatedRequest;
        const matchedRule = this.getMostSpecificRule(authReq.path);

        if (matchedRule) {
          const authorized = matchedRule.predicates.every((p) => p(authReq));
          if (!authorized) {
            throw new SecurityError(
              "Forbidden",
              HttpStatusCode.FORBIDDEN,
              true,
              MachineCode.FORBIDDEN,
            );
          }
        } else if (this.config.defaultDeny) {
          throw new SecurityError(
            "Forbidden",
            HttpStatusCode.FORBIDDEN,
            true,
            MachineCode.FORBIDDEN,
          );
        }

        next();
      } catch (err) {
        next(err);
      }
    };
  }

  private async runMiddlewares(req: Request, res: Response): Promise<void> {
    for (const middleware of this.config.middlewares) {
      if (res.headersSent) return;

      await new Promise<void>((resolve, reject) => {
        let called = false;

        middleware(req, res, (err?: any) => {
          if (called) return;
          called = true;

          if (err) reject(err);
          else resolve();
        });
      });
    }
  }

  private getMostSpecificRule(path: string): Rule | undefined {
    const candidates = this.config.rules.filter((rule) => {
      if (rule.route === "/") return true;
      if (path === rule.route) return true;

      const normalized = rule.route.endsWith("/")
        ? rule.route
        : rule.route + "/";

      return path.startsWith(normalized);
    });

    if (candidates.length === 0) {
      return undefined;
    }

    return candidates.sort((a, b) => b.route.length - a.route.length)[0];
  }
}

export class HttpSecurityBuilder {
  private rules: Rule[] = [];
  private middlewares: RequestHandler[] = [];
  private defaultDeny = false;

  constructor(options?: { defaultDeny?: boolean }) {
    if (options?.defaultDeny) {
      this.defaultDeny = true;
    }
  }

  public authorizeHttpRequests(
    config: (auth: AuthorizationManager) => void,
  ): this {
    const manager = new AuthorizationManager();
    config(manager);
    this.rules.push(...manager.getRules());
    return this;
  }

  public addFilterBefore(middleware: RequestHandler): this {
    this.middlewares.unshift(middleware);
    return this;
  }

  public addFilterAfter(middleware: RequestHandler): this {
    this.middlewares.push(middleware);
    return this;
  }

  public addFilter(middleware: RequestHandler): this {
    this.middlewares.push(middleware);
    return this;
  }

  public denyAllByDefault(): this {
    this.defaultDeny = true;
    return this;
  }

  public build(): SecurityFilterChain {
    return new SecurityFilterChain({
      rules: [...this.rules],
      middlewares: [...this.middlewares],
      defaultDeny: this.defaultDeny,
    });
  }
}

export class AuthorizationManager {
  private rules: Rule[] = [];

  public requestMatchers(route: string): RequestMatcher {
    return new RequestMatcher(route, this);
  }

  public addRule(route: string, predicates: Predicate[]) {
    this.rules.push({ route, predicates });
  }

  public getRules(): Rule[] {
    return [...this.rules];
  }
}

export class RequestMatcher {
  constructor(
    private readonly route: string,
    private readonly manager: AuthorizationManager,
  ) {}

  public permitAll(): void {
    this.manager.addRule(this.route, [() => true]);
  }

  public authenticated(): void {
    this.manager.addRule(this.route, [isAuthenticated]);
  }

  public access(...predicates: Predicate[]): void {
    this.manager.addRule(this.route, predicates);
  }
}
