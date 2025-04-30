/**
 * Format duration in hours to readable "Xh Ym" format
 */
export const formatDuration = (durationInHours: number) => {
  const hours = Math.floor(durationInHours);
  const minutes = Math.floor((durationInHours - hours) * 60);
  return `${hours}h ${minutes}m`;
};

/**
 * Extract GitHub issue details from URL
 */
export const getIssueDetails = (url: string) => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Format: https://github.com/owner/repo/issues/number
    if (pathParts.length >= 5) {
      const owner = pathParts[1];
      const repo = pathParts[2];
      const issueNumber = pathParts[4];
      
      return {
        owner,
        repo,
        issueNumber,
        fullName: `${owner}/${repo}#${issueNumber}`
      };
    }
  } catch (e) {}
  
  return { fullName: url };
};