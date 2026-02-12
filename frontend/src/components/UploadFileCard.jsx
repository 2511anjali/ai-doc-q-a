import React from "react";
import "../App.css";
export default function UploadedFileCard({
  fileName = "document.pdf",
  sizeText = "—",
  uploadedText = "Just now",
  onView,
  onDownload,
  onDelete,
}) {
  const ext = (fileName.split(".").pop() || "").toLowerCase();

const getBadge = () => {
  switch (ext) {
    case "pdf":
      return { text: "PDF", className: "badge-pdf" };

    case "docx":
    case "doc":
      return { text: "W", className: "badge-doc" };

    case "txt":
      return { text: "TXT", className: "badge-txt" };

    default:
      return { text: ext.toUpperCase(), className: "badge-default" };
  }
};

const badge = getBadge();


  return (
    <div className="upload-card">
      <div className="upload-left">
       <div className={`file-badge ${badge.className}`}>
         {badge.text}
       </div>
        <div className="file-meta">
          <div className="file-name" title={fileName}>
            {fileName}
          </div>
          <div className="file-sub">
            {sizeText || "—"} • {uploadedText}
          </div>
        </div>
      </div>

      <div className="upload-actions">
        {/* optional view button */}
        {typeof onView === "function" && (
          <button className="upload-icon-btn" onClick={onView} title="View">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        <button className="upload-icon-btn" onClick={onDownload} title="Download">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path
              d="M7 10l5 5 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <button className="upload-icon-btn danger" onClick={onDelete} title="Delete">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
  <g clip-path="url(#clip0_1641_17725)">
    <path d="M2 4H14" stroke="#1c1f24" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12.6668 4V13.3333C12.6668 14 12.0002 14.6667 11.3335 14.6667H4.66683C4.00016 14.6667 3.3335 14 3.3335 13.3333V4" stroke="#1c2027" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M5.3335 4.00065V2.66732C5.3335 2.00065 6.00016 1.33398 6.66683 1.33398H9.3335C10.0002 1.33398 10.6668 2.00065 10.6668 2.66732V4.00065" stroke="#1e2228" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6.6665 7.33398V11.334" stroke="#21252d" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9.3335 7.33398V11.334" stroke="#1f242b" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <defs>
    <clipPath id="clip0_1641_17725">
      <rect width="16" height="16" fill="white"/>
    </clipPath>
  </defs>
</svg>
        </button>
      </div>
    </div>
  );
}
