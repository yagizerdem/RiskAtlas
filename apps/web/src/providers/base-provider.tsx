import { createContext, useContext } from "react";
import { ThemeProvider } from "./theme-provider";

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
      <BaseProviderContext.Provider {...props} value={value}>
        {children}
      </BaseProviderContext.Provider>
    </ThemeProvider>
  );
}

export const useBase = () => {
  const context = useContext(BaseProviderContext);

  if (context === undefined)
    throw new Error("useBase must be used within a BaseProvider");

  return context;
};
