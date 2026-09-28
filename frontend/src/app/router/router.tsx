import { createBrowserRouter, Navigate } from "react-router-dom";
import { routePaths } from "@/shared/config/routes";
import { AppShell } from "@/widgets/app-shell";
import { DashboardPage } from "@/pages/dashboard";
import { ProductPage } from "@/pages/stock";
import { ForecastPage } from "@/pages/forecast";
import { ReorderPage } from "@/pages/reorder";
import { PlanningPage } from "@/pages/planning";
import { EconomicsPage } from "@/pages/economics";
import { ChatPage } from "@/pages/chat";
import { AlertsRoute, StockRoute } from "./MetaRoutes";

export const router = createBrowserRouter([
  {
    path: routePaths.dashboard,
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: routePaths.stock, element: <StockRoute /> },
      { path: `${routePaths.stock}/:sku`, element: <ProductPage /> },
      { path: routePaths.alerts, element: <AlertsRoute /> },
      { path: routePaths.forecast, element: <ForecastPage /> },
      { path: routePaths.reorder, element: <ReorderPage /> },
      { path: routePaths.planning, element: <PlanningPage /> },
      { path: routePaths.economics, element: <EconomicsPage /> },
      { path: routePaths.chat, element: <ChatPage /> },
      { path: "*", element: <Navigate to={routePaths.dashboard} replace /> },
    ],
  },
]);
