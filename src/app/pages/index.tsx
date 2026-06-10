import { lazy, type ComponentType } from 'react'

function lazyNamed<T extends Record<string, ComponentType<unknown>>>(
  factory: () => Promise<T>,
  exportName: keyof T,
) {
  return lazy(() =>
    factory().then((module) => ({ default: module[exportName] })),
  )
}

// Auth pages
export const LoginPage = lazy(() => import('./login/page'))
export const ForgotPasswordPage = lazy(() => import('./login/forgot-password/page'))
export const ResetPasswordPage = lazy(() => import('./login/reset-password/page'))
export const GithubCallbackPage = lazy(() => import('./login/github-callback/page'))
export const MicrosoftCallbackPage = lazy(() => import('./login/microsoft-callback/page'))

// Citizen & Passenger pages
export const TeamPage = lazy(() => import('./team/page'))
export const CitizenBoardingPage = lazy(() => import('./citizen/boarding/page'))
export const NearbyStopsPage = lazy(() => import('./nearby-stops/page'))
export const IncidentReportPage = lazy(() => import('./incident-report/page'))
export const TicketAlightSearchPage = lazy(() => import('./ticket/alight/page'))
export const TicketAlightValidationPage = lazy(() => import('./ticket/alight/[ticketId]/page'))

// Driver pages
export const DriverTurnStartPage = lazy(() => import('./driver/turn-start/page'))

// Admin pages - Security
export const DashboardPage = lazy(() => import('./security/dashboard/page'))
export const PermissionsPage = lazy(() => import('./security/permissions/page'))
export const ProfilesPage = lazy(() => import('./security/profiles/page'))
export const RolesPage = lazy(() => import('./security/roles/page'))
export const UsersPage = lazy(() => import('./security/users/page'))

// Admin pages - HU Features
export const AdminAgeDistributionPage = lazy(() => import('./admin/reports/age-distribution/page'))
export const AdminRouteCreatePage = lazy(() => import('./admin/routes/create/page'))

// Other pages
export const AccessDeniedPage = lazyNamed(() => import('./access-denied'), 'AccessDeniedPage')
export const RegisterProfilePage = lazy(() => import('./register-profile/page'))
export const RegisterBusPage = lazy(() => import('./fleet/register-bus/page'))
export const CardRechargePage = lazy(() => import('./card-recharge/page'))
export const CardRechargeStatusPage = lazy(() => import('./card-recharge/status/page'))
export const CardRechargeReturnPage = lazy(() => import('./card-recharge/return/page'))

export const BusinessDashboardPage = lazy(() => import('./business/dashboard/page'))
export const AddressesPage = lazy(() => import('./business/addresses/page'))
export const EnterprisesPage = lazy(() => import('./business/enterprises/page'))
export const StopsAdminPage = lazy(() => import('./business/stops/page'))
export const PaymentMethodsPage = lazy(() => import('./business/payment-methods/page'))
export const CitizensPage = lazy(() => import('./business/citizens/page'))
export const DriversAdminPage = lazy(() => import('./business/drivers/page'))
export const RoutesPage = lazy(() => import('./business/routes/page'))
export const NodesPage = lazy(() => import('./business/nodes/page'))
export const BusesPage = lazy(() => import('./business/buses/page'))
export const SchedulersPage = lazy(() => import('./business/schedulers/page'))
export const TurnsPage = lazy(() => import('./business/turns/page'))
export const PaymentMethodCitizensPage = lazy(() => import('./business/payment-method-citizens/page'))
export const IncidentsPage = lazy(() => import('./business/incidents/page'))
export const IncidentsByBusPage = lazy(() => import('./business/incidents/bus/[busId]/page'))
export const IncidentDetailPage = lazy(() => import('./business/incidents/[incidentId]/page'))
export const CitizenRoutesPage = lazy(() => import('./citizen/routes/page'))
export const CitizenRouteDetailPage = lazy(() => import('./citizen/routes/[id]/page'))
export const CitizenTripsPage = lazy(() => import('./citizen/trips/page'))
export const CitizenTripDetailPage = lazy(() => import('./citizen/trips/[historyId]/page'))
export const MessagingPage = lazy(() => import('./messaging/page'))
