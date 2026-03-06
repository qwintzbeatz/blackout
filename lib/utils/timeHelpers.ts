/**
 * Time helper utilities for Blackout NZ
 */
import { Timestamp } from 'firebase/firestore';

/**
 * Get human-readable time since a date
 * @param date - Date object, Timestamp, or null
 * @returns String like "just now", "5m ago", "1h ago", "2d ago"
 */
export const getTimeSince = (date: Date | Timestamp | null): string => {
  if (!date) {
    return 'unknown';
  }

  // Convert Timestamp to Date if needed
  const targetDate = date instanceof Date ? date : date.toDate();
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}y ago`;
};

/**
 * Format a date in a readable way
 * @param date - Date object or Timestamp
 * @returns String like "Today at 2:30 PM", "Yesterday at 10:15 AM", "Mar 3 at 5:45 PM"
 */
export const formatDateTime = (date: Date | Timestamp): string => {
  const targetDate = date instanceof Date ? date : date.toDate();
  const now = new Date();
  
  // Check if same day
  const isToday = targetDate.toDateString() === now.toDateString();
  if (isToday) {
    return `Today at ${formatTime(targetDate)}`;
  }

  // Check if yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = targetDate.toDateString() === yesterday.toDateString();
  if (isYesterday) {
    return `Yesterday at ${formatTime(targetDate)}`;
  }

  // Format as "Mar 3 at 2:30 PM"
  return `${formatDate(targetDate)} at ${formatTime(targetDate)}`;
};

/**
 * Format time as HH:MM AM/PM
 */
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

/**
 * Format date as "Mar 3, 2026"
 */
const formatDate = (date: Date): string => {
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Get relative time with more detail
 * @param date - Date object or Timestamp
 * @returns String like "2 hours ago", "3 days ago", "1 week ago"
 */
export const getDetailedTimeSince = (date: Date | Timestamp | null): string => {
  if (!date) {
    return 'unknown';
  }

  const targetDate = date instanceof Date ? date : date.toDate();
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
};

/**
 * Check if a timestamp is recent (within last hour)
 */
export const isRecent = (date: Date | Timestamp | null, minutes: number = 60): boolean => {
  if (!date) return false;
  
  const targetDate = date instanceof Date ? date : date.toDate();
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - targetDate.getTime()) / 60000);
  
  return diffInMinutes <= minutes;
};

/**
 * Get time until a future date
 */
export const getTimeUntil = (date: Date | Timestamp): string => {
  const targetDate = date instanceof Date ? date : date.toDate();
  const now = new Date();
  const diffInSeconds = Math.floor((targetDate.getTime() - now.getTime()) / 1000);

  if (diffInSeconds <= 0) {
    return 'now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d`;
};