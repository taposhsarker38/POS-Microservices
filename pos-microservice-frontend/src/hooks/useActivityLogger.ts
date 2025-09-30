// hooks/useActivityLogger.ts
import { useCallback } from 'react';
import { useAppSelector } from '@/store';
import { selectCurrentUser } from '@/features/auth/authSlice';

type ActivityType = 
  | 'page_visit'
  | 'button_click'
  | 'form_submit'
  | 'data_export'
  | 'user_login'
  | 'user_logout'
  | 'create_record'
  | 'update_record'
  | 'delete_record';

interface ActivityLog {
  activity_type: ActivityType;
  description: string;
  page_url: string;
  user_agent: string;
  ip_address?: string;
  metadata?: Record<string, any>;
}

export const useActivityLogger = () => {
  const user = useAppSelector(selectCurrentUser);

  const logActivity = useCallback(async (
    activityType: ActivityType,
    description: string,
    metadata?: Record<string, any>
  ) => {
    if (!user) return;

    try {
      const activityLog: ActivityLog = {
        activity_type: activityType,
        description,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        metadata,
      };

      // Send to backend logging endpoint
      await fetch('/api/activity-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityLog),
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Fail silently - don't break the app for logging failures
    }
  }, [user]);

  const logPageVisit = useCallback((pageName: string) => {
    logActivity('page_visit', `Visited ${pageName}`, {
      page_title: document.title,
      referrer: document.referrer,
    });
  }, [logActivity]);

  const logDataAction = useCallback((
    action: 'create' | 'update' | 'delete',
    model: string,
    recordId: string,
    changes?: Record<string, any>
  ) => {
    logActivity(
      `${action}_record` as ActivityType,
      `${action.charAt(0).toUpperCase() + action.slice(1)}d ${model}`,
      { model, record_id: recordId, changes }
    );
  }, [logActivity]);

  return {
    logActivity,
    logPageVisit,
    logDataAction,
  };
};