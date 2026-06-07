"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

type OnboardingData = {
  name: string;
  email: string;
  password: string;
  role: string;
  source: string;
  usageType: string;
  workspaceName: string;
  workspaceIcon: string;
};

type ContextType = {
  data: OnboardingData;
  updateData: (
    values: Partial<OnboardingData>
  ) => void;
};

const OnboardingContext =
  createContext<ContextType | null>(null);

export function OnboardingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [data, setData] =
    useState<OnboardingData>({
      name: "",
      email: "",
      password: "",
      role: "",
      source: "",
      usageType: "",
      workspaceName: "",
      workspaceIcon: "🧠",
    });

  function updateData(
    values: Partial<OnboardingData>
  ) {
    setData((prev) => ({
      ...prev,
      ...values,
    }));
  }

  return (
    <OnboardingContext.Provider
      value={{
        data,
        updateData,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context =
    useContext(OnboardingContext);

  if (!context) {
    throw new Error(
      "useOnboarding must be used inside OnboardingProvider"
    );
  }

  return context;
}