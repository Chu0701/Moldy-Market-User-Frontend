export const appraiserKeys = {
  profile: (userId) => ['appraiser', userId, 'profile'],
  status: (userId) => ['appraiser', userId, 'status'],
  openRequests: (userId, page) => ['appraiser', userId, 'open-requests', page],
  request: (userId, requestId) => ['appraiser', userId, 'request', requestId],
  applications: (userId, page) => ['appraiser', userId, 'applications', page],
  invitations: (userId, page) => ['appraiser', userId, 'invitations', page],
  assignments: (userId, page) => ['appraiser', userId, 'assignments', page],
  assignment: (userId, assignmentId) => ['appraiser', userId, 'assignment', assignmentId],
  reports: (userId, assignmentId) => ['appraiser', userId, 'reports', assignmentId],
  reviews: (userId, appraiserId, page) => ['appraiser', userId, 'reviews', appraiserId, page],
  commissions: (userId) => ['commission', userId, 'appraiser'],
  commission: (userId, commissionId) => ['commission', userId, 'appraiser', commissionId],
}
