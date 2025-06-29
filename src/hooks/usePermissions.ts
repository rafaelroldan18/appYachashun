import { useAuth } from '../context/AuthContext';

/**
 * Hook to check user permissions for various actions
 */
export function usePermissions() {
  const { user, userProfile } = useAuth();

  const isAuthenticated = !!user;
  const isAdmin = userProfile?.role === 'admin';
  const isModerator = userProfile?.role === 'moderator' || isAdmin;

  const can = {
    // Content creation permissions
    createQuestion: isAuthenticated,
    createAnswer: isAuthenticated,
    createReport: isAuthenticated,
    
    // Content modification permissions
    editQuestion: (questionUserId: string) => 
      isAuthenticated && (user?.id === questionUserId || isAdmin || isModerator),
    
    deleteQuestion: (questionUserId: string) => 
      isAuthenticated && (user?.id === questionUserId || isAdmin),
    
    editAnswer: (answerUserId: string) => 
      isAuthenticated && (user?.id === answerUserId || isAdmin || isModerator),
    
    deleteAnswer: (answerUserId: string) => 
      isAuthenticated && (user?.id === answerUserId || isAdmin),
    
    // Voting permissions
    voteAnswer: isAuthenticated,
    
    // Moderation permissions
    markBestAnswer: (questionUserId: string) => 
      isAuthenticated && (user?.id === questionUserId || isAdmin),
    
    manageReports: isModerator,
    manageCategories: isAdmin,
    manageUsers: isAdmin,
  };

  return { can, isAuthenticated, isAdmin, isModerator, userId: user?.id };
}