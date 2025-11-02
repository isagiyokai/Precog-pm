import { toast } from 'sonner@2.0.3';

/**
 * Safely copy text to clipboard with fallback
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    // Try modern Clipboard API first
    await navigator.clipboard.writeText(text);
    toast.success('Copied!');
  } catch (err) {
    // Fallback for environments where Clipboard API is blocked
    try {
      // Create temporary textarea
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      toast.success('Copied!');
    } catch (fallbackErr) {
      toast.error('Failed to copy to clipboard');
    }
  }
};
