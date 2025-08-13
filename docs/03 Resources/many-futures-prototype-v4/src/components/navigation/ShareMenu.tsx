import { useState } from 'react';
import type { Episode } from '../../types/episode';

interface ShareMenuProps {
  episode: Episode;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareMenu({ episode: _episode, isOpen, onClose }: ShareMenuProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      // In a real app, you'd show a toast notification here
      console.log('Link copied to clipboard');
      onClose();
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      // Mock PDF generation - in real app, you'd use a library like jsPDF or Puppeteer
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing
      console.log('PDF download would start here');
      // In real implementation:
      // const pdf = await generatePDF(episode);
      // downloadFile(pdf, `${episode.title}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsDownloading(false);
      onClose();
    }
  };

  const handleEmailShare = () => {
    // In real app, this would open an email sharing modal
    console.log('Email sharing modal would open here');
    alert('Email sharing feature coming soon!');
    onClose();
  };

  const handleLinkedInShare = () => {
    // LinkedIn sharing with auto-generated preview
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
    window.open(linkedinUrl, '_blank', 'width=600,height=600');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-30" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Menu */}
      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-40">
        <div className="py-1">
          <button
            onClick={handleCopyLink}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Link
          </button>
          
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {isDownloading ? 'Generating PDF...' : 'Download PDF'}
          </button>
          
          <hr className="my-1" />
          
          <button
            onClick={handleEmailShare}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Share via Email
            <span className="ml-auto text-xs text-blue-600 font-medium">BETA</span>
          </button>
          
          <button
            onClick={handleLinkedInShare}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Share on LinkedIn
          </button>
        </div>
      </div>
    </>
  );
}