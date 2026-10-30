import React from "react";

export function FacebookIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#1877F2" />
      <path
        fill="#FFFFFF"
        d="M21.5 17h-3.5V28h-4.5V17H11v-4h2.5v-2.8c0-3.3 2-5.2 5-5.2 1.5 0 3 .2 3 .2v3.3h-1.7c-1.6 0-2.1 1-2.1 2v2.5h3.8l-.5 4z"
      />
    </svg>
  );
}

export function InstagramIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ig-grad-32" cx="30%" cy="107%" r="150%">
          <stop stopColor="#fdf497" offset="0%" />
          <stop stopColor="#fdf497" offset="5%" />
          <stop stopColor="#fd5949" offset="45%" />
          <stop stopColor="#d6249f" offset="60%" />
          <stop stopColor="#285AEB" offset="90%" />
        </radialGradient>
      </defs>
      <rect width="32" height="32" rx="7" fill="url(#ig-grad-32)" />
      <rect x="7" y="7" width="18" height="18" rx="5" fill="none" stroke="#ffffff" strokeWidth="2" />
      <circle cx="16" cy="16" r="4.2" fill="none" stroke="#ffffff" strokeWidth="2" />
      <circle cx="21.5" cy="10.5" r="1.2" fill="#ffffff" />
    </svg>
  );
}

export function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#25D366" />
      <path
        fill="#FFFFFF"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16 6C10.48 6 6 10.48 6 16c0 1.95.56 3.77 1.53 5.32L6 26l4.82-1.49C12.31 25.37 14.1 26 16 26c5.52 0 10-4.48 10-10S21.52 6 16 6zm0 18.25c-1.63 0-3.17-.48-4.47-1.3l-.32-.2-3.32 1.03 1.05-3.23-.21-.34c-.93-1.41-1.48-3.09-1.48-4.91 0-4.83 3.92-8.75 8.75-8.75s8.75 3.92 8.75 8.75-3.92 8.95-8.75 8.95zm4.84-6.57c-.27-.13-1.57-.77-1.81-.86-.24-.09-.42-.13-.6.13-.18.27-.69.86-.84 1.04-.16.18-.31.2-.58.07-.27-.13-1.13-.42-2.15-1.33-.8-.71-1.33-1.59-1.49-1.86-.16-.27-.02-.41.12-.55.12-.12.27-.31.4-.47.13-.16.18-.27.27-.44.09-.18.04-.33-.02-.47-.07-.13-.6-1.44-.82-1.97-.22-.52-.44-.45-.6-.46h-.51c-.18 0-.47.07-.71.33-.24.27-.93.91-.93 2.22s.96 2.58 1.09 2.76c.13.18 1.88 2.87 4.56 4.02.64.28 1.14.44 1.53.56.64.2 1.23.17 1.69.1.52-.08 1.57-.64 1.79-1.26.22-.62.22-1.15.16-1.26-.07-.11-.25-.18-.51-.31z"
      />
    </svg>
  );
}
