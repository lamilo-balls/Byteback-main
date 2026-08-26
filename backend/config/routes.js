/**
 * config/routes.js
 *
 * Test all of these in Postman against http://localhost:1337
 * See backend/README.md for sample request bodies.
 */

module.exports.routes = {

  // -- Auth (Registration / Login / Forgot Password / Email Verification) --
  'POST /api/register': 'UserController.register',
  'POST /api/login': 'UserController.login',
  'POST /api/logout': 'UserController.logout',
  'POST /api/forgot-password': 'UserController.forgotPassword',
  'POST /api/verify-email': 'UserController.verifyEmail',
  'POST /api/resend-verification': 'UserController.resendVerification',
  'GET  /api/me': 'UserController.me',

  // -- Profile / Settings --
  'PUT  /api/profile': 'UserController.updateProfile',
  'POST /api/change-password': 'UserController.changePassword',
  'PUT  /api/notification-prefs': 'UserController.updateNotificationPrefs',
  'POST /api/deactivate-account': 'UserController.deactivateAccount',

  // -- Complaints (Category -> Details -> Evidence -> Review, and Dashboard) --
  'POST /api/complaints': 'ComplaintController.create',
  'GET  /api/complaints': 'ComplaintController.find',
  'GET  /api/complaints/:id': 'ComplaintController.findOne',
  'GET  /api/complaints/track/:referenceNumber': 'ComplaintController.track',

  // -- Notifications --
  'GET  /api/notifications': 'NotificationController.find',
  'POST /api/notifications/:id/read': 'NotificationController.markRead',
  'POST /api/notifications/read-all': 'NotificationController.markAllRead',

  // -- Investigator --
  'GET  /api/investigator/dashboard': 'InvestigatorController.dashboard',
  'GET  /api/investigator/cases': 'InvestigatorController.assignedCases',
  'GET  /api/investigator/cases/:id': 'InvestigatorController.workspace',
  'POST /api/investigator/cases/:id/notes': 'InvestigatorController.addNote',
  'GET  /api/investigator/cases/:id/timeline': 'InvestigatorController.timeline',
  'POST /api/investigator/cases/:id/status': 'InvestigatorController.updateStatus',

  // -- Supervisor --
  'GET  /api/supervisor/dashboard': 'SupervisorController.dashboard',
  'GET  /api/supervisor/unassigned': 'SupervisorController.unassignedCases',
  'POST /api/supervisor/cases/:id/assign': 'SupervisorController.assign',
  'GET  /api/supervisor/investigators': 'SupervisorController.investigatorPerformance',
  'GET  /api/supervisor/workload': 'SupervisorController.workload',

  // -- Admin --
  'GET  /api/admin/dashboard': 'AdminController.dashboard',
  'GET  /api/admin/complaints': 'AdminController.listComplaints',
  'PUT  /api/admin/complaints/:id': 'AdminController.updateComplaint',
  'GET  /api/admin/users': 'AdminController.listUsers',
  'POST /api/admin/users': 'AdminController.createUser',
  'PUT  /api/admin/users/:id/role': 'AdminController.changeUserRole',
  'PUT  /api/admin/users/:id/status': 'AdminController.changeUserStatus',
  'DELETE /api/admin/users/:id': 'AdminController.deleteUser',
  'GET  /api/admin/reports': 'AdminController.reports',
  'GET  /api/admin/audit-logs': 'AdminController.auditLogs',
  'GET  /api/admin/security-logs': 'AdminController.securityLogs',
  'GET  /api/admin/settings': 'AdminController.getSettings',
  'PUT  /api/admin/settings': 'AdminController.updateSettings'

};
