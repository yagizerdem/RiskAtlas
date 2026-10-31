import { createContext, useContext } from "react";
import { ThemeProvider } from "./theme-provider";
import { Provider as ReduxProvider } from "react-redux";
import { store as authStore } from "@/store/auth/auth-store";

type BaseProviderProps = {
  children: React.ReactNode;
};

type BaseProviderState = Record<string, never>;

const initialState: BaseProviderState = {};

const BaseProviderContext = createContext<BaseProviderState | undefined>(
  undefined,
);

export function BaseProvider({ children, ...props }: BaseProviderProps) {
  const value = initialState;

  return (
    <ThemeProvider>
      <ReduxProvider store={authStore}>
        <BaseProviderContext.Provider {...props} value={value}>
          {children}
        </BaseProviderContext.Provider>
      </ReduxProvider>
    </ThemeProvider>
  );
}

export const useBase = () => {
  const context = useContext(BaseProviderContext);

  if (context === undefined)
    throw new Error("useBase must be used within a BaseProvider");

  return context;
};
