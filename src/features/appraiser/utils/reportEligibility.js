/** @param {string} assignmentStatus @param {Array<{ status?: string }>} reports */
export function canSubmitAppraisalReport(assignmentStatus, reports) {
  const rejectionCount = reports.filter((report) => report.status === 'REJECTED').length
  return (
    assignmentStatus === 'IN_PROGRESS' &&
    rejectionCount < 3 &&
    !reports.some((report) => report.status === 'SUBMITTED')
  )
}
