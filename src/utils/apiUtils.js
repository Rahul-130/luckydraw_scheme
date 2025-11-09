/**
 * Extracts a user-friendly error message from an API error object.
 * It checks for standard Axios error structures.
 *
 * @param {object} error The error object, likely from an Axios catch block.
 * @param {string} defaultMessage A fallback message if a specific one can't be found.
 * @returns {string} The extracted or default error message.
 */
export const extractApiErrorMessage = (error, defaultMessage = 'An unexpected error occurred.') => {
  return error?.response?.data?.error || error?.response?.data?.message || error?.message || defaultMessage;
};
