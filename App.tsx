import React from "react";
import BusinessApp from "./business-app/App";
import ChargebackShieldWebApp from "./business-app/WebApp";

const isWeb = typeof (globalThis as any)?.document !== "undefined";

export default function App() {
  return isWeb ? <ChargebackShieldWebApp /> : <BusinessApp />;
}